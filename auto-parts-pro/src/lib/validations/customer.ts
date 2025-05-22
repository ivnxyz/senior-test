import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
});

