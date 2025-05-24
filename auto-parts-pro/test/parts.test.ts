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
  });

  describe('list', () => {
    it('should return all parts ordered by creation date desc', async () => {
      // Create a part first
      const part = await caller.parts.create({
        name: 'Test Part',
        description: 'Test description',
        costPrice: 10.00,
        sellPrice: 15.00,
        profit: 5.00,
        availableQuantity: 10,
      });

      const result = await caller.parts.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        id: part.id,
        name: part.name,
        description: part.description,
      });
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
    });
  });
}); 