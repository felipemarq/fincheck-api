import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

import { RefreshTokenController } from "@application/controllers/auth/RefreshTokenController";

export const handler = lambdaHttpAdapter(RefreshTokenController);
