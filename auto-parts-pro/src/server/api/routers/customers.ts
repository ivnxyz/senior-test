import { customerSchema } from "@/lib/validations/customer";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const customersRouter = createTRPCRouter({
  create: publicProcedure.input(customerSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.customer.create({
      data: input,
    });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});