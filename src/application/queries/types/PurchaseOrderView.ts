import { Customer } from "@application/entities/Customer";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { PurchaseOrderWithCustomer } from "@infra/database/neon/repositories/PurchaseOrderRepository";

export type PurchaseOrderCustomerView = Pick<
  Customer,
  "id" | "legalName" | "tradeName" | "document" | "active"
>;

export type PurchaseOrderItemView = {
  id?: string;
  lineNumber: number;
  description: string;
  brand: string;
  specification?: string;
  originalUnit: string;
  normalizedUnit: string;
  orderedQuantity: number;
  saleUnitPrice: number;
  officialTotal: number;
  notes?: string;
  acquiredQuantity: number;
  receivedQuantity: number;
  deliveredQuantity: number;
  excessQuantity: number;
  progress: PurchaseOrder.Progress;
};

export type PurchaseOrderView = {
  id?: string;
  entityId: string;
  customerId: string;
  customer: PurchaseOrderCustomerView;
  orderNumber: string;
  externalNumber?: string;
  quoteNumber?: string;
  requisitionNumber?: string;
  issuedAt: Date;
  requestedDeliveryAt?: Date;
  officialTotal: number;
  calculatedItemsTotal: number;
  hasTotalMismatch: boolean;
  paymentTerms?: string;
  instructions?: string;
  notes?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  lifecycleStatus: PurchaseOrder.LifecycleStatus;
  progress: PurchaseOrder.Progress;
  itemCount: number;
  items: PurchaseOrderItemView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type PurchaseOrderSummaryView = Omit<PurchaseOrderView, "items">;

export function toPurchaseOrderView({
  order,
  customer,
}: PurchaseOrderWithCustomer): PurchaseOrderView {
  return {
    id: order.id,
    entityId: order.entityId,
    customerId: order.customerId,
    customer: {
      id: customer.id,
      legalName: customer.legalName,
      tradeName: customer.tradeName,
      document: customer.document,
      active: customer.active,
    },
    orderNumber: order.orderNumber,
    externalNumber: order.externalNumber,
    quoteNumber: order.quoteNumber,
    requisitionNumber: order.requisitionNumber,
    issuedAt: order.issuedAt,
    requestedDeliveryAt: order.requestedDeliveryAt,
    officialTotal: order.officialTotal,
    calculatedItemsTotal: order.calculatedItemsTotal,
    hasTotalMismatch: order.hasTotalMismatch,
    paymentTerms: order.paymentTerms,
    instructions: order.instructions,
    notes: order.notes,
    billingAddress: order.billingAddress,
    deliveryAddress: order.deliveryAddress,
    lifecycleStatus: order.lifecycleStatus,
    progress: order.progress,
    itemCount: order.items.length,
    items: order.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      description: item.description,
      brand: item.brand,
      specification: item.specification,
      originalUnit: item.originalUnit,
      normalizedUnit: item.normalizedUnit,
      orderedQuantity: item.orderedQuantity,
      saleUnitPrice: item.saleUnitPrice,
      officialTotal: item.officialTotal,
      notes: item.notes,
      acquiredQuantity: 0,
      receivedQuantity: 0,
      deliveredQuantity: 0,
      excessQuantity: 0,
      progress: order.progress,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toPurchaseOrderSummary(
  purchaseOrder: PurchaseOrderWithCustomer
): PurchaseOrderSummaryView {
  const { items: _items, ...summary } = toPurchaseOrderView(purchaseOrder);
  return summary;
}
