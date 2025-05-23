import { z } from "zod";

export const laborSchema = z.object({
  orderId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  hours: z.number().positive(),
  rate: z.number().positive(),
  total: z.number().positive(),
});

export const editLaborSchema = z.object({
  id: z.number().int().positive(),
  orderId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  hours: z.number().positive(),
  rate: z.number().positive(),
  total: z.number().positive(),
}); 