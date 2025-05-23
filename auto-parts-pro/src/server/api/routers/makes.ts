import { editMakeSchema, newMakeSchema } from "@/lib/validations/makes";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const makesRouter = createTRPCRouter({
  create: publicProcedure.input(newMakeSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.make.create({ data: input });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.make.findMany();
  }),
  update: publicProcedure.input(editMakeSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.make.update({ where: { id: input.id }, data: input });
  }),
  delete: publicProcedure.input(z.coerce.number()).mutation(async ({ ctx, input }) => {
    return ctx.db.make.delete({ where: { id: input } });
  }),
});