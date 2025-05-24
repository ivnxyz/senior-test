import { PrismaClient } from '@prisma/client';
import { createSoftDeleteExtension } from 'prisma-extension-soft-delete';
import { env } from '@/env';
import { appRouter } from '@/server/api/root';

// Create test database client
const createTestPrismaClient = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: env.TEST_DATABASE_URL ?? '',
      },
    },
    log: ['error'],
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

export const testDb = createTestPrismaClient();

// Create test context
export const createTestContext = () => {
  return {
    db: testDb,
    headers: new Headers(),
  };
};

// Create test caller
export const createTestCaller = () => {
  const ctx = createTestContext();
  return appRouter.createCaller(ctx);
};

// Helper to clean database
export const cleanDatabase = async () => {
  const tablenames = await testDb.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await testDb.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
};

// Setup database for tests
export const setupTestDatabase = async () => {
  const { execSync } = await import('child_process');
  execSync('npx prisma migrate deploy', { 
    env: { ...process.env, DATABASE_URL: env.TEST_DATABASE_URL ?? '' },
    stdio: 'inherit' 
  });
};

// Cleanup database connection
export const teardownTestDatabase = async () => {
  await testDb.$disconnect();
}; 