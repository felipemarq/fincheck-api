import { Invoice } from "@application/entities/Invoice";
import { InvoiceView } from "./InvoiceView";
import { ReceivablesSummary } from "@application/services/buildReceivablesSummary";

export type ReceivableView = InvoiceView & {
  orderNumber: string;
  orderExternalNumber?: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  daysOverdue: number;
};

export type ReceivableFilterStatus =
  | "ALL"
  | "PENDING"
  | Invoice.ReceivableStatus;

export const receivableFilterStatuses = [
  "ALL",
  "PENDING",
  Invoice.ReceivableStatus.NOT_ISSUED,
  Invoice.ReceivableStatus.OPEN,
  Invoice.ReceivableStatus.OVERDUE,
  Invoice.ReceivableStatus.PARTIALLY_RECEIVED,
  Invoice.ReceivableStatus.RECEIVED,
  Invoice.ReceivableStatus.CANCELLED,
] as const;

export type ReceivableSort =
  | "URGENCY"
  | "DUE_ASC"
  | "DUE_DESC"
  | "BALANCE_DESC"
  | "ISSUED_DESC";

export const receivableSortOptions = [
  "URGENCY",
  "DUE_ASC",
  "DUE_DESC",
  "BALANCE_DESC",
  "ISSUED_DESC",
] as const;

export type ReceivablesPage = {
  receivables: ReceivableView[];
  summary: ReceivablesSummary;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
