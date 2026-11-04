# Fiscal returns and bank reconciliation

Invoices now distinguish `SALE`, `SALES_RETURN` and `PURCHASE_RETURN`.
The default preserves all existing invoices as sales. The fiscal document amount
remains separate from the customer receivable. Issued returns never create a
receivable or accept a receipt.

A standalone sales return may reference a sale for the same customer and entity.
Only issued returns reduce that sale's available balance. Full returns display
`RETURNED`, rather than paid. Cancelling a return restores the balance. Returns
with uncertain origins can remain unlinked and are shown for review. Linking a
return beyond the unpaid balance is rejected; refunds require a separate flow.

Apply `node scripts/migrateInvoiceReturns.mjs` using the guarded AWS profile
`felipe`, account `379443323181`, then publish the additive financial module using
`scripts/deployFinancialModule.ps1`. Do not deploy the main stack. The migration
backs up and compares all pre-existing financial records.

The repository fixture covers migration compatibility, original document values,
partial/full returns, cancellation, tenant checks, over-credit prevention,
receipt rejection on returns, summary filters and dashboard totals.

Operational imports and bank evidence are local reconciliation artifacts, not
source-code fixtures. Imports use the existing controllers as Felipe's active
administrator membership, preserve existing invoices, check every saved total in
cents, and retain source XML hashes and bank transaction identifiers. A bank line
must never be consumed twice. No bank transfers are performed by reconciliation.
