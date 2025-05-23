import { z } from "zod";

export const newMakeSchema = z.object({
  name: z.string().min(1),
})

export const editMakeSchema = z.object({
  id: z.number().int().positive("Make ID is required"),
  name: z.string().min(1),
});