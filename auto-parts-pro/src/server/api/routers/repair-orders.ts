import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { repairOrderSchema } from "@/lib/validations/repair-order";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

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
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
        restockParts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, restockParts } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Get current repair order with details
        const currentOrder = await tx.repairOrder.findUnique({
          where: { id },
          include: {
            orderDetails: {
              include: {
                part: true,
              },
            },
          },
        });

        if (!currentOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repair order not found",
          });
        }

        // Check if order is already cancelled (cannot be updated)
        if (currentOrder.status === "CANCELLED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot update a cancelled repair order",
          });
        }

        // Handle PENDING to IN_PROGRESS transition
        if (currentOrder.status === "PENDING" && status === "IN_PROGRESS") {
          // Check if there are enough parts in stock
          for (const orderDetail of currentOrder.orderDetails) {
            const part = await tx.part.findUnique({
              where: { id: orderDetail.partId },
            });

            if (!part) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Part ${orderDetail.part.name} not found`,
              });
            }

            if (part.availableQuantity < orderDetail.quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Not enough stock for part "${part.name}". Available: ${part.availableQuantity}, Required: ${orderDetail.quantity}`,
              });
            }
          }

          // Deduct parts from stock
          for (const orderDetail of currentOrder.orderDetails) {
            await tx.part.update({
              where: { id: orderDetail.partId },
              data: {
                availableQuantity: {
                  decrement: orderDetail.quantity,
                },
              },
            });
          }
        }

        // Handle IN_PROGRESS to CANCELLED transition with restocking
        if (
          currentOrder.status === "IN_PROGRESS" &&
          status === "CANCELLED" &&
          restockParts
        ) {
          // Return parts to stock
          for (const orderDetail of currentOrder.orderDetails) {
            await tx.part.update({
              where: { id: orderDetail.partId },
              data: {
                availableQuantity: {
                  increment: orderDetail.quantity,
                },
              },
            });
          }
        }

        // Update the repair order status
        const updatedOrder = await tx.repairOrder.update({
          where: { id },
          data: { status },
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

        return updatedOrder;
      });
    }),
}); 