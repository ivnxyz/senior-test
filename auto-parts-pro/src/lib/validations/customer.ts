import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional().nullable(),
});

export const editCustomerSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  phoneNumber: z.string().optional().nullable(),
});
