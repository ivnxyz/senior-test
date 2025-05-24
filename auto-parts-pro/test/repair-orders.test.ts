import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Repair Orders Router', () => {
  const caller = createTestCaller();
  let testCustomer: any;
  let testMake: any;
  let testVehicle: any;
  let testPart: any;

  beforeEach(async () => {
    // Create test data
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
      description: 'Test part description',
      costPrice: 25.00,
      sellPrice: 40.00,
      profit: 15.00,
      availableQuantity: 100,
    });
  });

  describe('create', () => {
    it('should create a basic repair order', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Basic repair order',
        costPrice: 100.00,
        sellPrice: 150.00,
        markUp: 50.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      };

      const result = await caller.repairOrders.create(repairOrderData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Basic repair order',
        status: 'PENDING',
      });
    });

    it('should create repair order with parts and labor', async () => {
      const repairOrderData = {
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Repair with parts and labor',
        costPrice: 100.00,
        sellPrice: 150.00,
        markUp: 50.00,
        profit: 50.00,
        priority: 'HIGH' as const,
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

      expect(result.orderDetails).toHaveLength(1);
      expect(result.labors).toHaveLength(1);
      expect(result.orderDetails[0]?.quantity).toBe(2);
      expect(result.labors[0]?.name).toBe('Oil Change');
    });
  });

  describe('list', () => {
    it('should return empty array when no orders exist', async () => {
      const result = await caller.repairOrders.list();
      expect(result).toEqual([]);
    });

    it('should return all repair orders', async () => {
      await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Test order',
        costPrice: 50.00,
        sellPrice: 75.00,
        markUp: 25.00,
        profit: 25.00,
        priority: 'LOW' as const,
        orderDetails: [],
        labors: [],
      });

      const result = await caller.repairOrders.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        description: 'Test order',
        status: 'PENDING',
        customer: {
          name: testCustomer.name,
        },
        vehicle: {
          model: testVehicle.model,
        },
      });
    });
  });

  describe('find', () => {
    it('should find repair order by ID', async () => {
      const order = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Find test order',
        costPrice: 100.00,
        sellPrice: 150.00,
        markUp: 50.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      });

      const result = await caller.repairOrders.find({ id: order.id });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(order.id);
      expect(result[0]?.description).toBe('Find test order');
    });

    it('should return empty array for non-existent ID', async () => {
      const result = await caller.repairOrders.find({ id: 99999 });
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update repair order status', async () => {
      const order = await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Status test order',
        costPrice: 100.00,
        sellPrice: 150.00,
        markUp: 50.00,
        profit: 50.00,
        priority: 'MEDIUM' as const,
        orderDetails: [],
        labors: [],
      });

      const result = await caller.repairOrders.updateStatus({
        id: order.id,
        status: 'COMPLETED',
      });

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('optimize', () => {
    it('should return optimization results', async () => {
      await caller.repairOrders.create({
        customerId: testCustomer.id,
        vehicleId: testVehicle.id,
        description: 'Order for optimization',
        costPrice: 100.00,
        sellPrice: 200.00,
        markUp: 100.00,
        profit: 100.00,
        priority: 'HIGH' as const,
        orderDetails: [],
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
    });
  });
}); 