import { customerSchema, editCustomerSchema } from "@/lib/validations/customer";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import z from "zod";

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
  delete: publicProcedure.input(z.coerce.number()).mutation(async ({ ctx, input }) => {
    return ctx.db.customer.delete({
      where: {
        id: input,
      },
    });
  }),
  update: publicProcedure.input(editCustomerSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.customer.update({
      where: {
        id: input.id,
      },
      data: input,
    });
  }),
});