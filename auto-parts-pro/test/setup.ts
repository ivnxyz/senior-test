import { beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, cleanDatabase, teardownTestDatabase } from './test-helpers';

// Global setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean up after each test
beforeEach(async () => {
  await cleanDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await teardownTestDatabase();
}); 