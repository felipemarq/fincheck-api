import { Acquisition } from "@application/entities/Acquisition";

type AcquisitionUpdate = {
  purchasedAt?: Date;
  paymentMethod?: string;
  creditCardId?: string | null;
  installmentCount?: number;
  firstPaymentDueAt?: Date | null;
  shippingCost?: number;
  generalDiscount?: number;
  otherExpenses?: number;
  status?: Acquisition.Status;
  items?: unknown[];
};

export function acquisitionUpdateAffectsPayables(
  input: AcquisitionUpdate,
  currentPaymentMethod: string
): boolean {
  const nextPaymentMethod = input.paymentMethod ?? currentPaymentMethod;
  const purchaseDateDefinesPaymentDate = ![
    Acquisition.PaymentMethod.CREDIT_CARD,
    Acquisition.PaymentMethod.BOLETO,
  ].includes(nextPaymentMethod as Acquisition.PaymentMethod);

  return (
    input.paymentMethod !== undefined ||
    input.creditCardId !== undefined ||
    input.installmentCount !== undefined ||
    input.firstPaymentDueAt !== undefined ||
    input.shippingCost !== undefined ||
    input.generalDiscount !== undefined ||
    input.otherExpenses !== undefined ||
    input.items !== undefined ||
    input.status === Acquisition.Status.CANCELLED ||
    (input.purchasedAt !== undefined && purchaseDateDefinesPaymentDate)
  );
}
