import {
  Acquisition,
  AcquisitionAllocation,
} from "@application/entities/Acquisition";

export type AcquisitionAllocationCost = {
  itemCost: number;
  shippingCost: number;
  otherExpenses: number;
  generalDiscount: number;
  totalCost: number;
};

type Target = {
  allocation?: AcquisitionAllocation;
  quantity: number;
  itemCostCents: number;
};

function allocateCents(totalCents: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const normalized = weights.some((weight) => weight > 0)
    ? weights.map((weight) => Math.max(weight, 0))
    : weights.map(() => 1);
  const totalWeight = normalized.reduce((sum, weight) => sum + weight, 0);
  const exact = normalized.map(
    (weight) => (totalCents * weight) / totalWeight
  );
  const allocated = exact.map(Math.floor);
  const remainder = totalCents - allocated.reduce((sum, value) => sum + value, 0);
  const priority = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; index < remainder; index += 1) {
    allocated[priority[index % priority.length].index] += 1;
  }

  return allocated;
}

export function calculateAcquisitionAllocationCosts(
  acquisition: Acquisition
): Map<AcquisitionAllocation, AcquisitionAllocationCost> {
  const targets: Target[] = [];

  acquisition.items.forEach((item) => {
    const itemTargets: Target[] = item.allocations.map((allocation) => ({
      allocation,
      quantity: allocation.allocatedQuantity,
      itemCostCents: 0,
    }));

    if (item.unallocatedQuantity > 0) {
      itemTargets.push({
        quantity: item.unallocatedQuantity,
        itemCostCents: 0,
      });
    }

    const itemCostParts = allocateCents(
      Math.round(item.totalCost * 100),
      itemTargets.map((target) => target.quantity)
    );
    itemTargets.forEach((target, index) => {
      target.itemCostCents = itemCostParts[index];
      targets.push(target);
    });
  });

  const headerWeights = targets.map((target) =>
    target.itemCostCents > 0 ? target.itemCostCents : target.quantity
  );
  const shippingParts = allocateCents(
    Math.round(acquisition.shippingCost * 100),
    headerWeights
  );
  const otherExpenseParts = allocateCents(
    Math.round(acquisition.otherExpenses * 100),
    headerWeights
  );
  const discountParts = allocateCents(
    Math.round(acquisition.generalDiscount * 100),
    headerWeights
  );
  const result = new Map<AcquisitionAllocation, AcquisitionAllocationCost>();

  targets.forEach((target, index) => {
    if (!target.allocation) return;
    const itemCost = target.itemCostCents / 100;
    const shippingCost = shippingParts[index] / 100;
    const otherExpenses = otherExpenseParts[index] / 100;
    const generalDiscount = discountParts[index] / 100;
    result.set(target.allocation, {
      itemCost,
      shippingCost,
      otherExpenses,
      generalDiscount,
      totalCost:
        (target.itemCostCents +
          shippingParts[index] +
          otherExpenseParts[index] -
          discountParts[index]) /
        100,
    });
  });

  return result;
}
