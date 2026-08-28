import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";

export type BodyWeightResponse = {
  id: string;
  measuredOn: string;
  weightKg: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toBodyWeightResponse(
  entry: BodyWeightEntry
): BodyWeightResponse {
  return {
    id: entry.id,
    measuredOn: entry.measuredOn,
    weightKg: entry.weightKg,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
