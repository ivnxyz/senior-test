import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Labors Router', () => {
  const caller = createTestCaller();
  let testCustomer: any;
  let testMake: any;
  let testVehicle: any;
  let testRepairOrder: any;

  beforeEach(async () => {
    // Create test data for labor tests
    testCustomer = await caller.customers.create({
      name: 'Test Customer',
      email: 'test@example.com',
      phoneNumber: null,
    });

    testMake = await caller.makes.create({
      name: 'Test Make',
    });

    testVehicle = await caller.vehicles.create({
      customerId: testCustomer.id,
      makeId: testMake.id,
      model: 'Test Model',
      year: 2020,
      licensePlate: 'TEST123',
    });

    testRepairOrder = await caller.repairOrders.create({
      customerId: testCustomer.id,
      vehicleId: testVehicle.id,
      description: 'Test repair order',
      costPrice: 100.00,
      sellPrice: 150.00,
      profit: 50.00,
      priority: 'MEDIUM' as const,
      orderDetails: [],
      labors: [],
    });
  });

  describe('create', () => {
    it('should create a new labor with valid data', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: 'Oil Change',
        description: 'Standard oil change service',
        hours: 1.5,
        rate: 75.00,
        total: 112.50,
      };

      const result = await caller.labors.create(laborData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        orderId: laborData.orderId,
        name: laborData.name,
        description: laborData.description,
        hours: laborData.hours,
        rate: laborData.rate,
        total: laborData.total,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        order: {
          id: testRepairOrder.id,
          customer: {
            id: testCustomer.id,
            name: testCustomer.name,
          },
          vehicle: {
            id: testVehicle.id,
            model: testVehicle.model,
            make: {
              id: testMake.id,
              name: testMake.name,
            },
          },
        },
      });
    });

    it('should create a labor without description', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: 'Brake Inspection',
        description: null,
        hours: 0.5,
        rate: 100.00,
        total: 50.00,
      };

      const result = await caller.labors.create(laborData);

      expect(result).toMatchObject({
        name: laborData.name,
        description: null,
        hours: laborData.hours,
        rate: laborData.rate,
        total: laborData.total,
      });
    });

    it('should throw error for non-existent repair order', async () => {
      const laborData = {
        orderId: 99999,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      };

      await expect(caller.labors.create(laborData)).rejects.toThrow('Repair order not found');
    });

    it('should throw error for empty name', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: '',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      };

      await expect(caller.labors.create(laborData)).rejects.toThrow();
    });

    it('should throw error for negative hours', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: -1.0,
        rate: 50.00,
        total: 50.00,
      };

      await expect(caller.labors.create(laborData)).rejects.toThrow();
    });

    it('should throw error for negative rate', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: -50.00,
        total: 50.00,
      };

      await expect(caller.labors.create(laborData)).rejects.toThrow();
    });

    it('should throw error for negative total', async () => {
      const laborData = {
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: -50.00,
      };

      await expect(caller.labors.create(laborData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty result when no labors exist', async () => {
      const result = await caller.labors.list();
      
      expect(result).toMatchObject({
        labors: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it('should return all labors with pagination', async () => {
      // Create multiple labors
      const labor1 = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Labor 1',
        description: 'First labor',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const labor2 = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Labor 2',
        description: 'Second labor',
        hours: 2.0,
        rate: 60.00,
        total: 120.00,
      });

      const result = await caller.labors.list();

      expect(result).toMatchObject({
        labors: expect.arrayContaining([
          expect.objectContaining({ id: labor1.id }),
          expect.objectContaining({ id: labor2.id }),
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      expect(result.labors).toHaveLength(2);
      expect(result.labors[0]?.id).toBe(labor2.id); // Most recent first
      expect(result.labors[1]?.id).toBe(labor1.id);
    });

    it('should filter labors by order ID', async () => {
      // Create another repair order
      const repairOrder2 = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Second repair order',
        costPrice: 200.00,
        sellPrice: 300.00,
        profit: 100.00,
        priority: 'HIGH' as const,
        orderDetails: [],
        labors: [],
      });

      // Create labors for both orders
      const labor1 = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Labor 1',
        description: 'First labor',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const labor2 = await caller.labors.create({
        orderId: repairOrder2.id,
        name: 'Labor 2',
        description: 'Second labor',
        hours: 2.0,
        rate: 60.00,
        total: 120.00,
      });

      // Filter by first order
      const result = await caller.labors.list({ orderId: testRepairOrder.id });

      expect(result.labors).toHaveLength(1);
      expect(result.labors[0]?.id).toBe(labor1.id);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple labors
      for (let i = 1; i <= 15; i++) {
        await caller.labors.create({
          orderId: testRepairOrder.id,
          name: `Labor ${i}`,
          description: `Labor ${i} description`,
          hours: 1.0,
          rate: 50.00,
          total: 50.00,
        });
      }

      // Get first page
      const page1 = await caller.labors.list({ page: 1, limit: 5 });
      expect(page1.labors).toHaveLength(5);
      expect(page1.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
      });

      // Get second page
      const page2 = await caller.labors.list({ page: 2, limit: 5 });
      expect(page2.labors).toHaveLength(5);
      expect(page2.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
      });
    });
  });

  describe('find', () => {
    it('should find labor by ID', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const result = await caller.labors.find({ id: labor.id });

      expect(result).toMatchObject({
        id: labor.id,
        name: labor.name,
        description: labor.description,
        hours: labor.hours,
        rate: labor.rate,
        total: labor.total,
        order: {
          id: testRepairOrder.id,
        },
      });
    });

    it('should throw error for non-existent labor', async () => {
      await expect(caller.labors.find({ id: 99999 })).rejects.toThrow('Labor not found');
    });
  });

  describe('update', () => {
    it('should update labor with valid data', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Original Labor',
        description: 'Original description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const updateData = {
        id: labor.id,
        orderId: testRepairOrder.id,
        name: 'Updated Labor',
        description: 'Updated description',
        hours: 2.0,
        rate: 75.00,
        total: 150.00,
      };

      const result = await caller.labors.update(updateData);

      expect(result).toMatchObject({
        id: labor.id,
        name: updateData.name,
        description: updateData.description,
        hours: updateData.hours,
        rate: updateData.rate,
        total: updateData.total,
      });
    });

    it('should throw error for non-existent labor', async () => {
      const updateData = {
        id: 99999,
        orderId: testRepairOrder.id,
        name: 'Non-existent',
        description: 'Test',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      };

      await expect(caller.labors.update(updateData)).rejects.toThrow('Labor not found');
    });

    it('should throw error when changing to non-existent repair order', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const updateData = {
        id: labor.id,
        orderId: 99999,
        name: 'Updated Labor',
        description: 'Updated description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      };

      await expect(caller.labors.update(updateData)).rejects.toThrow('Repair order not found');
    });
  });

  describe('delete', () => {
    it('should delete existing labor', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'To Delete',
        description: 'Labor to delete',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const result = await caller.labors.delete({ id: labor.id });

      expect(result).toMatchObject({
        id: labor.id,
        name: labor.name,
        description: labor.description,
      });

      // Verify labor is soft deleted (should not appear in list)
      const labors = await caller.labors.list();
      expect(labors.labors).toHaveLength(0);
    });

    it('should throw error for non-existent labor', async () => {
      await expect(caller.labors.delete({ id: 99999 })).rejects.toThrow('Labor not found');
    });
  });
}); 