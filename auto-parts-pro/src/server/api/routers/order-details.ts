import { orderDetailSchema, editOrderDetailSchema } from "@/lib/validations/order-detail";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const orderDetailsRouter = createTRPCRouter({
  create: publicProcedure
    .input(orderDetailSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify that the repair order exists
      const repairOrder = await ctx.db.repairOrder.findUnique({
        where: { id: input.orderId },
      });

      if (!repairOrder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repair order not found",
        });
      }

      // Verify that the part exists
      const part = await ctx.db.part.findUnique({
        where: { id: input.partId },
      });

      if (!part) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Part not found",
        });
      }

      // Check if there's enough stock available
      if (part.availableQuantity < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Not enough stock. Only ${part.availableQuantity} units available.`,
        });
      }

      return ctx.db.orderDetail.create({
        data: input,
        include: {
          part: true,
          order: {
            include: {
              vehicle: {
                include: {
                  make: true,
                },
              },
              customer: true,
            },
          },
        },
      });
    }),

  list: publicProcedure
    .input(
      z.object({
        orderId: z.number().int().optional(),
        partId: z.number().int().optional(),
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { orderId, partId, page = 1, limit = 10 } = input ?? {};
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        ...(orderId && { orderId }),
        ...(partId && { partId }),
      };

      const [orderDetails, total] = await Promise.all([
        ctx.db.orderDetail.findMany({
          where,
          include: {
            part: true,
            order: {
              include: {
                vehicle: {
                  include: {
                    make: true,
                  },
                },
                customer: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.orderDetail.count({ where }),
      ]);

      return {
        orderDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  find: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const orderDetail = await ctx.db.orderDetail.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: {
          part: true,
          order: {
            include: {
              vehicle: {
                include: {
                  make: true,
                },
              },
              customer: true,
            },
          },
        },
      });

      if (!orderDetail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order detail not found",
        });
      }

      return orderDetail;
    }),

  update: publicProcedure
    .input(editOrderDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if order detail exists and is not deleted
      const existingOrderDetail = await ctx.db.orderDetail.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!existingOrderDetail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order detail not found",
        });
      }

      // If orderId is being changed, verify the new repair order exists
      if (updateData.orderId !== existingOrderDetail.orderId) {
        const repairOrder = await ctx.db.repairOrder.findUnique({
          where: { id: updateData.orderId },
        });

        if (!repairOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repair order not found",
          });
        }
      }

      // If partId is being changed, verify the new part exists
      if (updateData.partId !== existingOrderDetail.partId) {
        const part = await ctx.db.part.findUnique({
          where: { id: updateData.partId },
        });

        if (!part) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Part not found",
          });
        }

        // Check if there's enough stock available for the new part
        if (part.availableQuantity < updateData.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Not enough stock. Only ${part.availableQuantity} units available.`,
          });
        }
      } else if (updateData.quantity !== existingOrderDetail.quantity) {
        // If only quantity is being changed, check stock for the existing part
        const part = await ctx.db.part.findUnique({
          where: { id: updateData.partId },
        });

        if (!part) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Part not found",
          });
        }

        // Calculate available stock considering the current quantity already allocated
        const availableStock = part.availableQuantity + existingOrderDetail.quantity;
        if (availableStock < updateData.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Not enough stock. Only ${availableStock} units available.`,
          });
        }
      }

      return ctx.db.orderDetail.update({
        where: { id },
        data: updateData,
        include: {
          part: true,
          order: {
            include: {
              vehicle: {
                include: {
                  make: true,
                },
              },
              customer: true,
            },
          },
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Check if order detail exists and is not already deleted
      const existingOrderDetail = await ctx.db.orderDetail.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!existingOrderDetail) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order detail not found",
        });
      }

      // Soft delete
      return ctx.db.orderDetail.delete({ where: { id: existingOrderDetail.id } });
    }),
});
