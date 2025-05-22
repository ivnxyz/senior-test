import { z } from "zod";

export const laborSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  hours: z.number().min(0, "Hours must be at least 0"),
  rate: z.number().min(0, "Rate must be at least 0"),
  total: z.number().min(0, "Total must be at least 0"),
});

export const orderDetailSchema = z.object({
  partId: z.number().int().positive("Part ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.number().min(0, "Cost price must be at least 0"),
  sellPrice: z.number().min(0, "Sell price must be at least 0"),
  profit: z.number(),
});

export const repairOrderSchema = z.object({
  vehicleId: z.number().int().positive("Vehicle ID is required"),
  customerId: z.number().int().positive("Customer ID is required"),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be at least 0"),
  sellPrice: z.number().min(0, "Sell price must be at least 0"),
  profit: z.number(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  orderDetails: z.array(orderDetailSchema),
  labors: z.array(laborSchema),
}); 