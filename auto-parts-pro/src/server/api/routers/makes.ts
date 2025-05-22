import { newMakeSchema } from "@/lib/validations/makes";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const makesRouter = createTRPCRouter({
  create: publicProcedure.input(newMakeSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.make.create({ data: input });
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.make.findMany();
  }),
});