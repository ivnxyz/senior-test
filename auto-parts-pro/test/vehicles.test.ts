import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Vehicles Router', () => {
  const caller = createTestCaller();
  let testCustomer: any;
  let testMake: any;

  beforeEach(async () => {
    // Create test customer and make for vehicle tests
    testCustomer = await caller.customers.create({
      name: 'Test Customer',
      email: 'test@example.com',
      phoneNumber: null,
    });

    testMake = await caller.makes.create({
      name: 'Test Make',
    });
  });

  describe('create', () => {
    it('should create a new vehicle with valid data', async () => {
      const vehicleData = {
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      };

      const result = await caller.vehicles.create(vehicleData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        customerId: vehicleData.customerId,
        makeId: vehicleData.makeId,
        model: vehicleData.model,
        year: vehicleData.year,
        licensePlate: vehicleData.licensePlate,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle year as string (coerced to number)', async () => {
      const vehicleData = {
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Accord',
        year: '2019' as any, // String that should be coerced to number
        licensePlate: 'XYZ789',
      };

      const result = await caller.vehicles.create(vehicleData);

      expect(result).toMatchObject({
        year: 2019, // Should be converted to number
      });
    });

    it('should throw error for non-existent customer', async () => {
      const vehicleData = {
        customerId: 99999,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      };

      await expect(caller.vehicles.create(vehicleData)).rejects.toThrow();
    });

    it('should throw error for non-existent make', async () => {
      const vehicleData = {
        customerId: testCustomer.id,
        makeId: 99999,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      };

      await expect(caller.vehicles.create(vehicleData)).rejects.toThrow();
    });

    it('should throw error for empty model', async () => {
      const vehicleData = {
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: '',
        year: 2020,
        licensePlate: 'ABC123',
      };

      await expect(caller.vehicles.create(vehicleData)).rejects.toThrow();
    });

    it('should throw error for empty license plate', async () => {
      const vehicleData = {
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: '',
      };

      await expect(caller.vehicles.create(vehicleData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array when no vehicles exist', async () => {
      const result = await caller.vehicles.list();
      expect(result).toEqual([]);
    });

    it('should return all vehicles with customer and make data', async () => {
      const vehicle = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      });

      const result = await caller.vehicles.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: vehicle.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        customer: {
          id: testCustomer.id,
          name: testCustomer.name,
          email: testCustomer.email,
        },
        make: {
          id: testMake.id,
          name: testMake.name,
        },
      });
    });

    it('should filter vehicles by customer ID', async () => {
      // Create another customer
      const customer2 = await caller.customers.create({
        name: 'Customer 2',
        email: 'customer2@example.com',
        phoneNumber: null,
      });

      // Create vehicles for both customers
      const vehicle1 = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      });

      const vehicle2 = await caller.vehicles.create({
        customerId: customer2.id,
        makeId: testMake.id,
        model: 'Accord',
        year: 2019,
        licensePlate: 'XYZ789',
      });

      // Filter by first customer
      const result = await caller.vehicles.list({ customerId: testCustomer.id });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(vehicle1.id);
    });

    it('should return vehicles ordered by creation date desc', async () => {
      const vehicle1 = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
      });

      const vehicle2 = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Accord',
        year: 2019,
        licensePlate: 'XYZ789',
      });

      const result = await caller.vehicles.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(vehicle2.id); // Most recent first
      expect(result[1]?.id).toBe(vehicle1.id);
    });
  });

  describe('update', () => {
    it('should update vehicle with valid data', async () => {
      const vehicle = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Original Model',
        year: 2020,
        licensePlate: 'OLD123',
      });

      const updateData = {
        id: vehicle.id,
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Updated Model',
        year: 2021,
        licensePlate: 'NEW456',
      };

      const result = await caller.vehicles.update(updateData);

      expect(result).toMatchObject({
        id: vehicle.id,
        model: updateData.model,
        year: updateData.year,
        licensePlate: updateData.licensePlate,
      });
    });

    it('should throw error for non-existent vehicle', async () => {
      const updateData = {
        id: 99999,
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Non-existent',
        year: 2020,
        licensePlate: 'ABC123',
      };

      await expect(caller.vehicles.update(updateData)).rejects.toThrow();
    });

    it('should throw error for empty model', async () => {
      const vehicle = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'Test Model',
        year: 2020,
        licensePlate: 'ABC123',
      });

      const updateData = {
        id: vehicle.id,
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: '',
        year: 2020,
        licensePlate: 'ABC123',
      };

      await expect(caller.vehicles.update(updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing vehicle', async () => {
      const vehicle = await caller.vehicles.create({
        customerId: testCustomer.id,
        makeId: testMake.id,
        model: 'To Delete',
        year: 2020,
        licensePlate: 'DEL123',
      });

      const result = await caller.vehicles.delete(vehicle.id);

      expect(result).toMatchObject({
        id: vehicle.id,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
      });

      // Verify vehicle is deleted
      const vehicles = await caller.vehicles.list();
      expect(vehicles).toHaveLength(0);
    });

    it('should throw error for non-existent vehicle', async () => {
      await expect(caller.vehicles.delete(99999)).rejects.toThrow();
    });
  });
}); 