import { z } from "zod";

export const partSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  profit: z.number().min(0),
  availableQuantity: z.number().min(0),
});

export const editPartSchema = partSchema.extend({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  profit: z.number().min(0),
  availableQuantity: z.number().min(0),
});
