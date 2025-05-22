import { editVehicleSchema, vehicleSchema } from "@/lib/validations/vehicle";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const vehiclesRouter = createTRPCRouter({
  create: publicProcedure.input(vehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.create({
      data: input,
    });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.vehicle.findMany({
      where: {
        customer: {
          deletedAt: null,
        },
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
  byCustomerId: publicProcedure
    .input(z.object({ customerId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.vehicle.findMany({
        where: {
          customerId: input.customerId,
          deletedAt: null,
        },
        include: {
          make: true,
        },
        orderBy: {
          createdAt: "desc",
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