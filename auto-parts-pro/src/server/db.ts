import { PrismaClient } from "@prisma/client";
import { createSoftDeleteExtension } from "prisma-extension-soft-delete";

import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends(createSoftDeleteExtension({
    models: {
      Customer: true,
      Make: true,
      Vehicle: true,
      Part: true,
      RepairOrder: true,
      OrderDetail: true,
      Labor: true,
    },
    defaultConfig: {
      field: "deletedAt",
      createValue: (deleted) => {
        if (deleted) return new Date()
        return null
      },
    },
  }));

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
