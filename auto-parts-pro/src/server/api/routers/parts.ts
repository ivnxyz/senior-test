import { partSchema, editPartSchema } from "@/lib/validations/parts";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import z from "zod";

export const partsRouter = createTRPCRouter({
  create: publicProcedure.input(partSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.part.create({
      data: input,
    });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.part.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  delete: publicProcedure.input(z.coerce.number()).mutation(async ({ ctx, input }) => {
    return ctx.db.part.delete({
      where: {
        id: input,
      },
    });
  }),
  update: publicProcedure.input(editPartSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.part.update({
      where: {
        id: input.id,
      },
      data: input,
    });
  }),
});