import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Repair Orders Router', () => {
  const caller = createTestCaller();
  let testCustomer: any;
  let testMake: any;
  let testVehicle: any;
  let testPart: any;

  beforeEach(async () => {
    // Create test data for repair order tests
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

    testPart = await caller.parts.create({
      name: 'Test Part',
      description: 'Test part for repair orders',
      costPrice: 25.00,
      sellPrice: 40.00,
      profit: 15.00,
      availableQuantity: 100,
    });
  });

  describe('create', () => {
    it('should create a new repair order with valid data', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 2,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [
          {
            name: 'Oil Change',
            description: 'Standard oil change',
            hours: 1.0,
            rate: 75.00,
            total: 75.00,
          },
        ],
      };

      const result = await caller.repairOrders.create(repairOrderData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        customerId: repairOrderData.customerId,
        vehicleId: repairOrderData.vehicleId,
        description: repairOrderData.description,
        status: 'PENDING',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        customer: {
          id: testCustomer.id,
          name: testCustomer.name,
        },
        vehicle: {
          id: testVehicle.id,
          model: testVehicle.model,
        },
        orderDetails: expect.arrayContaining([
          expect.objectContaining({
            partId: testPart.id,
            quantity: 2,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          }),
        ]),
        labors: expect.arrayContaining([
          expect.objectContaining({
            name: 'Oil Change',
            description: 'Standard oil change',
            hours: 1.0,
            rate: 75.00,
            total: 75.00,
          }),
        ]),
      });
    });

    it('should create a repair order without order details and labors', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Simple repair order',
        costPrice: 50.00,
        sellPrice: 75.00,
        profit: 25.00,
        priority: 'LOW' as const,
        orderDetails: [],
        labors: [],
      };

      const result = await caller.repairOrders.create(repairOrderData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        customerId: repairOrderData.customerId,
        vehicleId: repairOrderData.vehicleId,
        description: repairOrderData.description,
        status: 'PENDING',
        orderDetails: [],
        labors: [],
      });
    });

    it('should throw error for non-existent customer', async () => {
      const repairOrderData = {
        customerId: 99999,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      };

      await expect(caller.repairOrders.create(repairOrderData)).rejects.toThrow();
    });

    it('should throw error for non-existent vehicle', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: 99999,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      };

      await expect(caller.repairOrders.create(repairOrderData)).rejects.toThrow();
    });

    it('should throw error for negative cost price', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: -100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      };

      await expect(caller.repairOrders.create(repairOrderData)).rejects.toThrow();
    });

    it('should throw error for negative sell price', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: -150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      };

      await expect(caller.repairOrders.create(repairOrderData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array when no repair orders exist', async () => {
      const result = await caller.repairOrders.list();
      expect(result).toEqual([]);
    });

    it('should return all repair orders with related data', async () => {
      const repairOrder = await caller.repairOrders.create({
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

      const result = await caller.repairOrders.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: repairOrder.id,
        description: 'Test repair order',
        status: 'PENDING',
        customer: {
          id: testCustomer.id,
          name: testCustomer.name,
          email: testCustomer.email,
        },
        vehicle: {
          id: testVehicle.id,
          model: testVehicle.model,
          make: {
            id: testMake.id,
            name: testMake.name,
          },
        },
      });
    });

    it('should return repair orders ordered by creation date desc', async () => {
      const repairOrder1 = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'First repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      });

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

      const result = await caller.repairOrders.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(repairOrder2.id); // Most recent first
      expect(result[1]?.id).toBe(repairOrder1.id);
    });
  });

  describe('find', () => {
    it('should find repair order by ID', async () => {
      const repairOrder = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 1,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [
          {
            name: 'Test Labor',
            description: 'Test labor description',
            hours: 1.0,
            rate: 50.00,
            total: 50.00,
          },
        ],
      });

      const result = await caller.repairOrders.find({ id: repairOrder.id });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: repairOrder.id,
        description: 'Test repair order',
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
        orderDetails: expect.arrayContaining([
          expect.objectContaining({
            partId: testPart.id,
            quantity: 1,
            part: {
              id: testPart.id,
              name: testPart.name,
            },
          }),
        ]),
        labors: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Labor',
            description: 'Test labor description',
            hours: 1.0,
            rate: 50.00,
            total: 50.00,
          }),
        ]),
      });
    });

    it('should find repair orders by vehicle ID', async () => {
      const repairOrder1 = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'First repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      });

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

      const result = await caller.repairOrders.find({ vehicleId: testVehicle.id });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toContain(repairOrder1.id);
      expect(result.map(r => r.id)).toContain(repairOrder2.id);
    });

    it('should return empty array for non-existent repair order', async () => {
      const result = await caller.repairOrders.find({ id: 99999 });
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update status from PENDING to IN_PROGRESS', async () => {
      const repairOrder = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 2,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [],
      });

      const result = await caller.repairOrders.updateStatus({
        id: repairOrder.id,
        status: 'IN_PROGRESS',
      });

      expect(result).toMatchObject({
        id: repairOrder.id,
        status: 'IN_PROGRESS',
      });

      // Check that part quantity was decremented
      const updatedPart = await caller.parts.list();
      expect(updatedPart[0]?.availableQuantity).toBe(98); // 100 - 2
    });

    it('should update status from PENDING to COMPLETED', async () => {
      const repairOrder = await caller.repairOrders.create({
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

      const result = await caller.repairOrders.updateStatus({
        id: repairOrder.id,
        status: 'COMPLETED',
      });

      expect(result).toMatchObject({
        id: repairOrder.id,
        status: 'COMPLETED',
      });
    });

    it('should update status from IN_PROGRESS to CANCELLED with restocking', async () => {
      // First create and move to IN_PROGRESS
      const repairOrder = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 3,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [],
      });

      await caller.repairOrders.updateStatus({
        id: repairOrder.id,
        status: 'IN_PROGRESS',
      });

      // Now cancel with restocking
      const result = await caller.repairOrders.updateStatus({
        id: repairOrder.id,
        status: 'CANCELLED',
        restockParts: true,
      });

      expect(result).toMatchObject({
        id: repairOrder.id,
        status: 'CANCELLED',
      });

      // Check that part quantity was restored
      const updatedPart = await caller.parts.list();
      expect(updatedPart[0]?.availableQuantity).toBe(100); // Back to original
    });

    it('should throw error when trying to update non-existent repair order', async () => {
      await expect(
        caller.repairOrders.updateStatus({
          id: 99999,
          status: 'COMPLETED',
        })
      ).rejects.toThrow('Repair order not found');
    });

    it('should throw error when trying to update cancelled repair order', async () => {
      const repairOrder = await caller.repairOrders.create({
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

      // Cancel the order first
      await caller.repairOrders.updateStatus({
        id: repairOrder.id,
        status: 'CANCELLED',
      });

      // Try to update again
      await expect(
        caller.repairOrders.updateStatus({
          id: repairOrder.id,
          status: 'COMPLETED',
        })
      ).rejects.toThrow('Cannot update a cancelled repair order');
    });

    it('should throw error when insufficient stock for IN_PROGRESS', async () => {
      // Create a part with low stock
      const lowStockPart = await caller.parts.create({
        name: 'Low Stock Part',
        description: 'Part with low stock',
        costPrice: 10.00,
        sellPrice: 20.00,
        profit: 10.00,
        availableQuantity: 1,
      });

      const repairOrder = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [
          {
            partId: lowStockPart.id,
            quantity: 5, // More than available
            costPrice: 10.00,
            sellPrice: 20.00,
            profit: 10.00,
          },
        ],
        labors: [],
      });

      await expect(
        caller.repairOrders.updateStatus({
          id: repairOrder.id,
          status: 'IN_PROGRESS',
        })
      ).rejects.toThrow('Not enough stock');
    });
  });

  describe('optimize', () => {
    it('should optimize repair orders by profit', async () => {
      // Create multiple repair orders with different profits
      const repairOrder1 = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Low profit order',
        costPrice: 100.00,
        sellPrice: 120.00,
        profit: 20.00,
        priority: 'LOW' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 10,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [],
      });

      const repairOrder2 = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'High profit order',
        costPrice: 200.00,
        sellPrice: 350.00,
        profit: 150.00,
        priority: 'HIGH' as const,
        orderDetails: [
          {
            partId: testPart.id,
            quantity: 5,
            costPrice: 25.00,
            sellPrice: 40.00,
            profit: 15.00,
          },
        ],
        labors: [],
      });

      const result = await caller.repairOrders.optimize({
        objective: 'profit',
        status: 'PENDING',
      });

      expect(result).toMatchObject({
        selectedOrderIds: expect.any(Array),
        skippedOrderIds: expect.any(Array),
        objectiveValue: expect.any(Number),
        inventoryAfter: expect.any(Object),
      });

      // Should prefer higher profit order
      expect(result.selectedOrderIds).toContain(repairOrder2.id);
    });

    it('should optimize repair orders by priority', async () => {
      const result = await caller.repairOrders.optimize({
        objective: 'priority',
        status: 'PENDING',
      });

      expect(result).toMatchObject({
        selectedOrderIds: expect.any(Array),
        skippedOrderIds: expect.any(Array),
        objectiveValue: expect.any(Number),
        inventoryAfter: expect.any(Object),
      });
    });
  });
}); 