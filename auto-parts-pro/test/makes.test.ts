import { describe, it, expect } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Makes Router', () => {
  const caller = createTestCaller();

  describe('create', () => {
    it('should create a new make with valid data', async () => {
      const makeData = {
        name: 'Toyota',
      };

      const result = await caller.makes.create(makeData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        name: makeData.name,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error for empty name', async () => {
      const makeData = {
        name: '',
      };

      await expect(caller.makes.create(makeData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array when no makes exist', async () => {
      const result = await caller.makes.list();
      expect(result).toEqual([]);
    });

    it('should return all makes', async () => {
      // Create multiple makes
      const make1 = await caller.makes.create({ name: 'Honda' });
      const make2 = await caller.makes.create({ name: 'Ford' });

      const result = await caller.makes.list();

      expect(result).toHaveLength(2);
      expect(result.map(m => m.name)).toContain('Honda');
      expect(result.map(m => m.name)).toContain('Ford');
    });
  });

  describe('update', () => {
    it('should update make with valid data', async () => {
      const make = await caller.makes.create({ name: 'Original Make' });

      const updateData = {
        id: make.id,
        name: 'Updated Make',
      };

      const result = await caller.makes.update(updateData);

      expect(result).toMatchObject({
        id: make.id,
        name: updateData.name,
      });
    });

    it('should throw error for non-existent make', async () => {
      const updateData = {
        id: 99999,
        name: 'Non-existent',
      };

      await expect(caller.makes.update(updateData)).rejects.toThrow();
    });

    it('should throw error for empty name', async () => {
      const make = await caller.makes.create({ name: 'Test Make' });

      const updateData = {
        id: make.id,
        name: '',
      };

      await expect(caller.makes.update(updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing make', async () => {
      const make = await caller.makes.create({ name: 'To Delete' });

      const result = await caller.makes.delete(make.id);

      expect(result).toMatchObject({
        id: make.id,
        name: make.name,
      });

      // Verify make is deleted
      const makes = await caller.makes.list();
      expect(makes).toHaveLength(0);
    });

    it('should throw error for non-existent make', async () => {
      await expect(caller.makes.delete(99999)).rejects.toThrow();
    });

    it('should handle string ID input (coerced to number)', async () => {
      const make = await caller.makes.create({ name: 'String ID Test' });

      // The router uses z.coerce.number() so string should work
      const result = await caller.makes.delete(make.id.toString() as any);

      expect(result).toMatchObject({
        id: make.id,
      });
    });
  });
}); 