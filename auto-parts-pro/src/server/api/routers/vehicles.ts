import { editVehicleSchema, vehicleSchema } from "@/lib/validations/vehicle";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const vehiclesRouter = createTRPCRouter({
  create: publicProcedure.input(vehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.create({
      data: input,
    });
  }),
  list: publicProcedure
    .input(
      z.object({
        customerId: z.number().int().optional(),
      }).optional().nullable()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.vehicle.findMany({
        where: {
          ...(input?.customerId ? { customerId: input.customerId } : {}),
          customer: {
            deletedAt: null,
          },
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: true,
          make: true,
        },
      });
    }),
  delete: publicProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.delete({
      where: {
        id: input,
      },
    });
  }),
  update: publicProcedure.input(editVehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.update({
      where: {
        id: input.id,
      },
      data: input,
    });
  }),
});