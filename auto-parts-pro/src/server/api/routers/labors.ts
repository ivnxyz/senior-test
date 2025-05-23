import { laborSchema, editLaborSchema } from "@/lib/validations/labor";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const laborsRouter = createTRPCRouter({
  create: publicProcedure
    .input(laborSchema)
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

      return ctx.db.labor.create({
        data: input,
        include: {
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
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { orderId, page = 1, limit = 10 } = input ?? {};
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: null,
        ...(orderId && { orderId }),
      };

      const [labors, total] = await Promise.all([
        ctx.db.labor.findMany({
          where,
          include: {
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
        ctx.db.labor.count({ where }),
      ]);

      return {
        labors,
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
      const labor = await ctx.db.labor.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: {
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

      if (!labor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Labor not found",
        });
      }

      return labor;
    }),

  update: publicProcedure
    .input(editLaborSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if labor exists and is not deleted
      const existingLabor = await ctx.db.labor.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!existingLabor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Labor not found",
        });
      }

      // If orderId is being changed, verify the new repair order exists
      if (updateData.orderId !== existingLabor.orderId) {
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

      return ctx.db.labor.update({
        where: { id },
        data: updateData,
        include: {
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
      // Check if labor exists and is not already deleted
      const existingLabor = await ctx.db.labor.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!existingLabor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Labor not found",
        });
      }

      // Soft delete
      return ctx.db.labor.delete({ where: { id: existingLabor.id } });
    }),
});
