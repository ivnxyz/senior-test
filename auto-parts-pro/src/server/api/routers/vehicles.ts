import { vehicleSchema } from "@/lib/validations/vehicle";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const vehiclesRouter = createTRPCRouter({
  create: publicProcedure.input(vehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.vehicle.create({
      data: input,
    });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});