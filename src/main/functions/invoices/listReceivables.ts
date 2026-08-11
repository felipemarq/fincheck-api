import "reflect-metadata";

import { ListReceivablesController } from "@application/controllers/receivables/ListReceivablesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListReceivablesController);
