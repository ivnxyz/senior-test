import { z } from "zod";

export const orderDetailSchema = z.object({
  orderId: z.number().int().positive("Order ID is required"),
  partId: z.number().int().positive("Part ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.number().min(0, "Cost price must be at least 0"),
  sellPrice: z.number().min(0, "Sell price must be at least 0"),
  profit: z.number(),
});

export const editOrderDetailSchema = z.object({
  id: z.number().int().positive(),
  orderId: z.number().int().positive("Order ID is required"),
  partId: z.number().int().positive("Part ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.number().min(0, "Cost price must be at least 0"),
  sellPrice: z.number().min(0, "Sell price must be at least 0"),
  profit: z.number(),
}); 