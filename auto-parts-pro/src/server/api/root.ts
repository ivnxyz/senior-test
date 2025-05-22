import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { customersRouter } from "@/server/api/routers/customers";
import { makesRouter } from "@/server/api/routers/makes";
import { vehiclesRouter } from "@/server/api/routers/vehicles";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  customers: customersRouter,
  makes: makesRouter,
  vehicles: vehiclesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
