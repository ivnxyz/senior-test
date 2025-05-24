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
    it('should create a new labor', async () => {
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
      });
    });
  });

  describe('list', () => {
    it('should return empty list when no labors exist', async () => {
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

    it('should return list of labors', async () => {
      await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Test Labor',
        description: 'Test description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const result = await caller.labors.list();

      expect(result.labors).toHaveLength(1);
      expect(result.labors[0]).toMatchObject({
        name: 'Test Labor',
        description: 'Test description',
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
        name: 'Test Labor',
        description: 'Test description',
      });
    });
  });

  describe('update', () => {
    it('should update labor', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'Original Labor',
        description: 'Original description',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      const result = await caller.labors.update({
        id: labor.id,
        orderId: testRepairOrder.id,
        name: 'Updated Labor',
        description: 'Updated description',
        hours: 2.0,
        rate: 75.00,
        total: 150.00,
      });

      expect(result).toMatchObject({
        id: labor.id,
        name: 'Updated Labor',
        description: 'Updated description',
        hours: 2.0,
        rate: 75.00,
        total: 150.00,
      });
    });
  });

  describe('delete', () => {
    it('should delete labor', async () => {
      const labor = await caller.labors.create({
        orderId: testRepairOrder.id,
        name: 'To Delete',
        description: 'Labor to delete',
        hours: 1.0,
        rate: 50.00,
        total: 50.00,
      });

      await caller.labors.delete({ id: labor.id });

      // Verify labor is not in list anymore
      const labors = await caller.labors.list();
      expect(labors.labors).toHaveLength(0);
    });
  });
}); 