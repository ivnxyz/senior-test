import { z } from "zod";

export const newMakeSchema = z.object({
  name: z.string().min(1),
})