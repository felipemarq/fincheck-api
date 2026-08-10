import { BadRequestException } from "@application/errors/http/BadRequestException";

const roundMoney = (value: number) => {
  const scaledValue = value * 100;

  return (
    Math.round(
      scaledValue + Number.EPSILON * Math.max(1, Math.abs(scaledValue))
    ) / 100
  );
};

export function calculateQuotationTotals({
  items,
  freight = 0,
  discount = 0,
}: {
  items: Array<{ quantity: number; unitPrice: number }>;
  freight?: number;
  discount?: number;
}) {
  const itemTotals = items.map((item) =>
    roundMoney(item.quantity * item.unitPrice)
  );
  const subtotal = roundMoney(
    itemTotals.reduce((total, value) => total + value, 0)
  );
  const normalizedFreight = roundMoney(freight);
  const normalizedDiscount = roundMoney(discount);

  if (normalizedDiscount > subtotal + normalizedFreight) {
    throw new BadRequestException(
      "O desconto nao pode ser maior que o subtotal somado ao frete."
    );
  }

  return {
    itemTotals,
    subtotal,
    freight: normalizedFreight,
    discount: normalizedDiscount,
    total: roundMoney(subtotal + normalizedFreight - normalizedDiscount),
  };
}
