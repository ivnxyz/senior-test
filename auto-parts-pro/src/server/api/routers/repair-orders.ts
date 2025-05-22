import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { repairOrderSchema } from "@/lib/validations/repair-order";
import type { Prisma } from "@prisma/client";

export const repairOrdersRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.repairOrder.findMany({
      where: { deletedAt: null },
      include: {
        vehicle: {
          include: {
            make: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),
  find: publicProcedure
    .input(
      z.object({
        id: z.number().int().optional(),
        vehicleId: z.number().int().optional(),
      }).refine(data => data.id !== undefined || data.vehicleId !== undefined, {
        message: "Either id or vehicleId must be provided"
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, vehicleId } = input;

      const where: Prisma.RepairOrderWhereInput = {};
      
      // If id is provided, find a single repair order
      if (id) {
        where.id = id;
      }
      
      // If vehicleId is provided, find all repair orders for that vehicle
      if (vehicleId) {
        where.vehicleId = vehicleId;
      }

      return await ctx.db.repairOrder.findMany({
        where,
        include: {
          vehicle: {
            include: {
              make: true,
            },
          },
          customer: true,
          orderDetails: {
            include: {
              part: true,
            },
          },
          labors: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),
  create: publicProcedure
    .input(repairOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { orderDetails, labors, ...repairOrderData } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Create the repair order
        const repairOrder = await tx.repairOrder.create({
          data: {
            ...repairOrderData,
            status: "PENDING", // Default status is PENDING
            orderDetails: {
              create: orderDetails.map((detail) => ({
                partId: detail.partId,
                quantity: detail.quantity,
                costPrice: detail.costPrice,
                sellPrice: detail.sellPrice,
                profit: detail.profit,
              })),
            },
            labors: {
              create: labors.map((labor) => ({
                name: labor.name,
                description: labor.description,
                hours: labor.hours,
                rate: labor.rate,
                total: labor.total,
              })),
            },
          },
          include: {
            vehicle: true,
            customer: true,
            orderDetails: {
              include: {
                part: true,
              },
            },
            labors: true,
          },
        });

        return repairOrder;
      });
    }),
}); 