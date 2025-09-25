// src/application/queries/types/TransactionListItem.ts
import { Transaction } from "@application/entities/Transaction";
import { Account } from "@application/entities/Account";

export type TransactionListItem = Transaction & {
  account: {
    id: string;
    name: string;
    color: string;
    type: Account.Type;
  } | null;
  category: {
    id: string;
    name: string;
    icon: string;
    type: Transaction.Type;
  } | null;
};
