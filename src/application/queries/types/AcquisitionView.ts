import { Acquisition } from "@application/entities/Acquisition";
import { Product } from "@application/entities/Product";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";
import { calculateAcquisitionAllocationCosts } from "@application/services/calculateAcquisitionAllocationCosts";

export type AcquisitionDestinationContext = {
  item: PurchaseOrderItem;
  purchaseOrderId: string;
  orderNumber: string;
  customerName: string;
};

export type AcquisitionAllocationView = {
  id?: string;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  orderNumber: string;
  customerName: string;
  lineNumber: number;
  description: string;
  originalUnit: string;
  allocatedQuantity: number;
  itemCost: number;
  shippingCost: number;
  otherExpenses: number;
  generalDiscount: number;
  totalCost: number;
  notes?: string;
};

export type AcquisitionItemView = {
  id?: string;
  productId: string;
  description: string;
  brand: string;
  packaging: string;
  normalizedUnit: string;
  acquiredQuantity: number;
  allocatedQuantity: number;
  unallocatedQuantity: number;
  costUnitPrice: number;
  grossCost: number;
  lineDiscount: number;
  totalCost: number;
  notes?: string;
  allocations: AcquisitionAllocationView[];
};

export type AcquisitionView = {
  id?: string;
  entityId: string;
  purchaseOrderId?: string;
  sellerName?: string;
  sellerDocument?: string;
  channel?: string;
  sellerOrderNumber?: string;
  purchasedAt: Date;
  buyerName: string;
  paymentMethod: string;
  paymentInstrument?: string;
  paymentHolder?: string;
  creditCardId?: string;
  installmentCount: number;
  firstPaymentDueAt?: Date;
  shippingCost: number;
  generalDiscount: number;
  otherExpenses: number;
  status: Acquisition.Status;
  notes?: string;
  itemCount: number;
  destinationCount: number;
  relatedOrderCount: number;
  unallocatedItemCount: number;
  itemsSubtotal: number;
  totalCost: number;
  allocatedCostForCurrentOrder?: number;
  items: AcquisitionItemView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export function toAcquisitionView(
  acquisition: Acquisition,
  products: Product[],
  destinationContexts: AcquisitionDestinationContext[],
  currentPurchaseOrderId?: string
): AcquisitionView {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const contextsByItemId = new Map(
    destinationContexts.map((context) => [context.item.id, context])
  );
  const allocationCosts = calculateAcquisitionAllocationCosts(acquisition);
  const relatedOrderIds = new Set<string>();
  let allocatedCostForCurrentOrder = 0;

  const items = acquisition.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Produto ${item.productId} nao encontrado para a compra.`);
    }

    const allocations = item.allocations.map((allocation) => {
      const context = contextsByItemId.get(allocation.purchaseOrderItemId);
      if (!context) {
        throw new Error(
          `Destino ${allocation.purchaseOrderItemId} nao encontrado para a compra.`
        );
      }
      const cost = allocationCosts.get(allocation)!;
      relatedOrderIds.add(context.purchaseOrderId);
      if (context.purchaseOrderId === currentPurchaseOrderId) {
        allocatedCostForCurrentOrder += cost.totalCost;
      }

      return {
        id: allocation.id,
        purchaseOrderItemId: allocation.purchaseOrderItemId,
        purchaseOrderId: context.purchaseOrderId,
        orderNumber: context.orderNumber,
        customerName: context.customerName,
        lineNumber: context.item.lineNumber,
        description: context.item.description,
        originalUnit: context.item.originalUnit,
        allocatedQuantity: allocation.allocatedQuantity,
        itemCost: cost.itemCost,
        shippingCost: cost.shippingCost,
        otherExpenses: cost.otherExpenses,
        generalDiscount: cost.generalDiscount,
        totalCost: cost.totalCost,
        notes: allocation.notes,
      };
    });

    return {
      id: item.id,
      productId: item.productId,
      description: product.name,
      brand: product.brand,
      packaging: product.packaging,
      normalizedUnit: product.normalizedUnit,
      acquiredQuantity: item.acquiredQuantity,
      allocatedQuantity: item.allocatedQuantity,
      unallocatedQuantity: item.unallocatedQuantity,
      costUnitPrice: item.costUnitPrice,
      grossCost: item.grossCost,
      lineDiscount: item.lineDiscount,
      totalCost: item.totalCost,
      notes: item.notes,
      allocations,
    };
  });

  return {
    id: acquisition.id,
    entityId: acquisition.entityId,
    purchaseOrderId: acquisition.purchaseOrderId,
    sellerName: acquisition.sellerName,
    sellerDocument: acquisition.sellerDocument,
    channel: acquisition.channel,
    sellerOrderNumber: acquisition.sellerOrderNumber,
    purchasedAt: acquisition.purchasedAt,
    buyerName: acquisition.buyerName,
    paymentMethod: acquisition.paymentMethod,
    paymentInstrument: acquisition.paymentInstrument,
    paymentHolder: acquisition.paymentHolder,
    creditCardId: acquisition.creditCardId,
    installmentCount: acquisition.installmentCount,
    firstPaymentDueAt: acquisition.firstPaymentDueAt,
    shippingCost: acquisition.shippingCost,
    generalDiscount: acquisition.generalDiscount,
    otherExpenses: acquisition.otherExpenses,
    status: acquisition.status,
    notes: acquisition.notes,
    itemCount: acquisition.items.length,
    destinationCount: items.reduce(
      (total, item) => total + item.allocations.length,
      0
    ),
    relatedOrderCount: relatedOrderIds.size,
    unallocatedItemCount: items.filter((item) => item.unallocatedQuantity > 0)
      .length,
    itemsSubtotal: acquisition.itemsSubtotal,
    totalCost: acquisition.totalCost,
    allocatedCostForCurrentOrder:
      currentPurchaseOrderId === undefined
        ? undefined
        : Math.round(allocatedCostForCurrentOrder * 100) / 100,
    items,
    createdAt: acquisition.createdAt,
    updatedAt: acquisition.updatedAt,
  };
}
