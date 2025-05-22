import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { repairOrderSchema } from "@/lib/validations/repair-order";

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

  byId: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.repairOrder.findUnique({
        where: { id: input.id, deletedAt: null },
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
      });
    }),
    
  byVehicleId: publicProcedure
    .input(z.object({ vehicleId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.repairOrder.findMany({
        where: { 
          vehicleId: input.vehicleId,
          deletedAt: null 
        },
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