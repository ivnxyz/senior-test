import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Order Details Router', () => {
  const caller = createTestCaller();
  let testCustomer: any;
  let testMake: any;
  let testVehicle: any;
  let testRepairOrder: any;
  let testPart: any;

  beforeEach(async () => {
    // Create test data for order detail tests
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

    testPart = await caller.parts.create({
      name: 'Test Part',
      description: 'Test part for order details',
      costPrice: 25.00,
      sellPrice: 40.00,
      profit: 15.00,
      availableQuantity: 100,
    });
  });

  describe('create', () => {
    it('should create a new order detail with valid data', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 2,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      const result = await caller.orderDetails.create(orderDetailData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        orderId: orderDetailData.orderId,
        partId: orderDetailData.partId,
        quantity: orderDetailData.quantity,
        costPrice: orderDetailData.costPrice,
        sellPrice: orderDetailData.sellPrice,
        profit: orderDetailData.profit,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        part: {
          id: testPart.id,
          name: testPart.name,
        },
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

    it('should throw error for non-existent repair order', async () => {
      const orderDetailData = {
        orderId: 99999,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow('Repair order not found');
    });

    it('should throw error for non-existent part', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: 99999,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow('Part not found');
    });

    it('should throw error when quantity exceeds available stock', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 150, // More than available (100)
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow('Not enough stock');
    });

    it('should throw error for zero quantity', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 0,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow();
    });

    it('should throw error for negative cost price', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: -25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow();
    });

    it('should throw error for negative sell price', async () => {
      const orderDetailData = {
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: -40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.create(orderDetailData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty result when no order details exist', async () => {
      const result = await caller.orderDetails.list();
      
      expect(result).toMatchObject({
        orderDetails: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it('should return all order details with pagination', async () => {
      // Create multiple order details
      const orderDetail1 = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const orderDetail2 = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 2,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const result = await caller.orderDetails.list();

      expect(result).toMatchObject({
        orderDetails: expect.arrayContaining([
          expect.objectContaining({ id: orderDetail1.id }),
          expect.objectContaining({ id: orderDetail2.id }),
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      expect(result.orderDetails).toHaveLength(2);
      expect(result.orderDetails[0]?.id).toBe(orderDetail2.id); // Most recent first
      expect(result.orderDetails[1]?.id).toBe(orderDetail1.id);
    });

    it('should filter order details by order ID', async () => {
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

      // Create order details for both orders
      const orderDetail1 = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const orderDetail2 = await caller.orderDetails.create({
        orderId: repairOrder2.id,
        partId: testPart.id,
        quantity: 2,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      // Filter by first order
      const result = await caller.orderDetails.list({ orderId: testRepairOrder.id });

      expect(result.orderDetails).toHaveLength(1);
      expect(result.orderDetails[0]?.id).toBe(orderDetail1.id);
    });

    it('should filter order details by part ID', async () => {
      // Create another part
      const part2 = await caller.parts.create({
        name: 'Second Part',
        description: 'Second test part',
        costPrice: 30.00,
        sellPrice: 50.00,
        profit: 20.00,
        availableQuantity: 50,
      });

      // Create order details for both parts
      const orderDetail1 = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const orderDetail2 = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: part2.id,
        quantity: 1,
        costPrice: 30.00,
        sellPrice: 50.00,
        profit: 20.00,
      });

      // Filter by first part
      const result = await caller.orderDetails.list({ partId: testPart.id });

      expect(result.orderDetails).toHaveLength(1);
      expect(result.orderDetails[0]?.id).toBe(orderDetail1.id);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple order details
      for (let i = 1; i <= 15; i++) {
        await caller.orderDetails.create({
          orderId: testRepairOrder.id,
          partId: testPart.id,
          quantity: 1,
          costPrice: 25.00,
          sellPrice: 40.00,
          profit: 15.00,
        });
      }

      // Get first page
      const page1 = await caller.orderDetails.list({ page: 1, limit: 5 });
      expect(page1.orderDetails).toHaveLength(5);
      expect(page1.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
      });

      // Get second page
      const page2 = await caller.orderDetails.list({ page: 2, limit: 5 });
      expect(page2.orderDetails).toHaveLength(5);
      expect(page2.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
      });
    });
  });

  describe('find', () => {
    it('should find order detail by ID', async () => {
      const orderDetail = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const result = await caller.orderDetails.find({ id: orderDetail.id });

      expect(result).toMatchObject({
        id: orderDetail.id,
        orderId: orderDetail.orderId,
        partId: orderDetail.partId,
        quantity: orderDetail.quantity,
        costPrice: orderDetail.costPrice,
        sellPrice: orderDetail.sellPrice,
        profit: orderDetail.profit,
        part: {
          id: testPart.id,
          name: testPart.name,
        },
        order: {
          id: testRepairOrder.id,
        },
      });
    });

    it('should throw error for non-existent order detail', async () => {
      await expect(caller.orderDetails.find({ id: 99999 })).rejects.toThrow('Order detail not found');
    });
  });

  describe('update', () => {
    it('should update order detail with valid data', async () => {
      const orderDetail = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const updateData = {
        id: orderDetail.id,
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 3,
        costPrice: 30.00,
        sellPrice: 50.00,
        profit: 20.00,
      };

      const result = await caller.orderDetails.update(updateData);

      expect(result).toMatchObject({
        id: orderDetail.id,
        quantity: updateData.quantity,
        costPrice: updateData.costPrice,
        sellPrice: updateData.sellPrice,
        profit: updateData.profit,
      });
    });

    it('should throw error for non-existent order detail', async () => {
      const updateData = {
        id: 99999,
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.update(updateData)).rejects.toThrow('Order detail not found');
    });

    it('should throw error when changing to non-existent repair order', async () => {
      const orderDetail = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const updateData = {
        id: orderDetail.id,
        orderId: 99999,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.update(updateData)).rejects.toThrow('Repair order not found');
    });

    it('should throw error when changing to non-existent part', async () => {
      const orderDetail = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const updateData = {
        id: orderDetail.id,
        orderId: testRepairOrder.id,
        partId: 99999,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      };

      await expect(caller.orderDetails.update(updateData)).rejects.toThrow('Part not found');
    });
  });

  describe('delete', () => {
    it('should delete existing order detail', async () => {
      const orderDetail = await caller.orderDetails.create({
        orderId: testRepairOrder.id,
        partId: testPart.id,
        quantity: 1,
        costPrice: 25.00,
        sellPrice: 40.00,
        profit: 15.00,
      });

      const result = await caller.orderDetails.delete({ id: orderDetail.id });

      expect(result).toMatchObject({
        id: orderDetail.id,
        orderId: orderDetail.orderId,
        partId: orderDetail.partId,
        quantity: orderDetail.quantity,
      });

      // Verify order detail is soft deleted (should not appear in list)
      const orderDetails = await caller.orderDetails.list();
      expect(orderDetails.orderDetails).toHaveLength(0);
    });

    it('should throw error for non-existent order detail', async () => {
      await expect(caller.orderDetails.delete({ id: 99999 })).rejects.toThrow('Order detail not found');
    });
  });
}); 