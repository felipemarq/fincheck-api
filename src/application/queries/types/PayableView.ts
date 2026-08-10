import { Payable } from "@application/entities/Payable";

export type PayableView = {
  id: string;
  entityId: string;
  acquisitionId: string;
  creditCardId?: string;
  description: string;
  sellerName?: string;
  orderNumber: string;
  cardName?: string;
  cardLastFour?: string;
  paymentMethod: string;
  installmentNumber: number;
  installmentCount: number;
  amount: number;
  dueAt: Date;
  status: Payable.Status;
  paidAt?: Date;
  overdue: boolean;
};

export type PayablesSummary = {
  openAmount: number;
  overdueAmount: number;
  dueNext30DaysAmount: number;
  paidAmount: number;
  openCount: number;
  overdueCount: number;
};

export type PayablesResult = {
  payables: PayableView[];
  summary: PayablesSummary;
};
