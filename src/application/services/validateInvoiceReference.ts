import { Invoice } from "@application/entities/Invoice";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";

export async function validateInvoiceReference(invoice: Invoice, repository: InvoiceRepository, previous?: Invoice): Promise<void> {
  if (!invoice.referencedInvoiceId) return;
  if (invoice.operationType !== Invoice.OperationType.SALES_RETURN || invoice.purchaseOrderId || invoice.id === invoice.referencedInvoiceId) {
    throw new BadRequestException("Vincule a devolucao de venda avulsa a uma nota de origem valida.");
  }
  const source = await repository.findOne({entityId: invoice.entityId, invoiceId: invoice.referencedInvoiceId});
  if (!source || !source.isSale || source.status !== Invoice.Status.ISSUED || source.customerId !== invoice.customerId) {
    throw new BadRequestException("A nota de origem deve ser uma venda emitida para o mesmo cliente e empresa.");
  }
  if (invoice.status !== Invoice.Status.ISSUED) return;
  const previousCredit = previous && previous.referencedInvoiceId === source.id && previous.status === Invoice.Status.ISSUED ? previous.documentAmount : 0;
  if (source.receivedAmount + source.returnedAmount - previousCredit + invoice.documentAmount > source.documentAmount + 0.005) {
    throw new BadRequestException("A devolucao ultrapassa o saldo disponivel da nota de origem. Confira os recebimentos e devolucoes anteriores.");
  }
}
