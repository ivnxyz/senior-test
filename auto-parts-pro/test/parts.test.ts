import { describe, it, expect } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Parts Router', () => {
  const caller = createTestCaller();

  describe('create', () => {
    it('should create a new part with valid data', async () => {
      const partData = {
        name: 'Brake Pad',
        description: 'High quality brake pad',
        costPrice: 25.50,
        sellPrice: 45.00,
        profit: 19.50,
        availableQuantity: 100,
      };

      const result = await caller.parts.create(partData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        name: partData.name,
        description: partData.description,
        costPrice: partData.costPrice,
        sellPrice: partData.sellPrice,
        profit: partData.profit,
        availableQuantity: partData.availableQuantity,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a part without description', async () => {
      const partData = {
        name: 'Oil Filter',
        description: null,
        costPrice: 10.00,
        sellPrice: 18.00,
        profit: 8.00,
        availableQuantity: 50,
      };

      const result = await caller.parts.create(partData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        name: partData.name,
        description: null,
        costPrice: partData.costPrice,
        sellPrice: partData.sellPrice,
        profit: partData.profit,
        availableQuantity: partData.availableQuantity,
      });
    });

    it('should throw error for empty name', async () => {
      const partData = {
        name: '',
        description: 'Test part',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.create(partData)).rejects.toThrow();
    });

    it('should throw error for negative cost price', async () => {
      const partData = {
        name: 'Test Part',
        description: 'Test part',
        costPrice: -10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.create(partData)).rejects.toThrow();
    });

    it('should throw error for negative sell price', async () => {
      const partData = {
        name: 'Test Part',
        description: 'Test part',
        costPrice: 10.00,
        sellPrice: -15.00,
        profit: 5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.create(partData)).rejects.toThrow();
    });

    it('should throw error for negative profit', async () => {
      const partData = {
        name: 'Test Part',
        description: 'Test part',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: -5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.create(partData)).rejects.toThrow();
    });

    it('should throw error for negative available quantity', async () => {
      const partData = {
        name: 'Test Part',
        description: 'Test part',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: -10,
      };

      await expect(caller.parts.create(partData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array when no parts exist', async () => {
      const result = await caller.parts.list();
      expect(result).toEqual([]);
    });

    it('should return all parts ordered by creation date desc', async () => {
      // Create multiple parts
      const part1 = await caller.parts.create({
        name: 'Part 1',
        description: 'First part',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      const part2 = await caller.parts.create({
        name: 'Part 2',
        description: 'Second part',
        costPrice: 20.00,
        sellPrice: 30.00,
        profit: 10.00,
        availableQuantity: 20,
      });

      const result = await caller.parts.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(part2.id); // Most recent first
      expect(result[1]?.id).toBe(part1.id);
    });
  });

  describe('update', () => {
    it('should update part with valid data', async () => {
      const part = await caller.parts.create({
        name: 'Original Part',
        description: 'Original description',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      const updateData = {
        id: part.id,
        name: 'Updated Part',
        description: 'Updated description',
        costPrice: 12.00,
        sellPrice: 18.00,
        profit: 6.00,
        availableQuantity: 15,
      };

      const result = await caller.parts.update(updateData);

      expect(result).toMatchObject({
        id: part.id,
        name: updateData.name,
        description: updateData.description,
        costPrice: updateData.costPrice,
        sellPrice: updateData.sellPrice,
        profit: updateData.profit,
        availableQuantity: updateData.availableQuantity,
      });
    });

    it('should throw error for non-existent part', async () => {
      const updateData = {
        id: 99999,
        name: 'Non-existent',
        description: 'Test',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.update(updateData)).rejects.toThrow();
    });

    it('should throw error for empty name', async () => {
      const part = await caller.parts.create({
        name: 'Test Part',
        description: 'Test',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      const updateData = {
        id: part.id,
        name: '',
        description: 'Test',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      };

      await expect(caller.parts.update(updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing part', async () => {
      const part = await caller.parts.create({
        name: 'To Delete',
        description: 'Part to delete',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      const result = await caller.parts.delete(part.id);

      expect(result).toMatchObject({
        id: part.id,
        name: part.name,
        description: part.description,
      });

      // Verify part is deleted
      const parts = await caller.parts.list();
      expect(parts).toHaveLength(0);
    });

    it('should throw error for non-existent part', async () => {
      await expect(caller.parts.delete(99999)).rejects.toThrow();
    });

    it('should handle string ID input (coerced to number)', async () => {
      const part = await caller.parts.create({
        name: 'String ID Test',
        description: 'Test',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      // The router uses z.coerce.number() so string should work
      const result = await caller.parts.delete(part.id.toString() as any);

      expect(result).toMatchObject({
        id: part.id,
      });
    });
  });
}); 