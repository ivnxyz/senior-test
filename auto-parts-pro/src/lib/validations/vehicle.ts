import { z } from "zod";

export const vehicleSchema = z.object({
  customerId: z.number(),
  makeId: z.number(),
  model: z.string(),
  year: z.coerce.number(),
  licensePlate: z.string(),
});