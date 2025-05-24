import { describe, it, expect } from 'vitest';
import { createTestCaller } from './test-helpers';

describe('Customers Router', () => {
  const caller = createTestCaller();

  describe('create', () => {
    it('should create a new customer with valid data', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
      };

      const result = await caller.customers.create(customerData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        name: customerData.name,
        email: customerData.email,
        phoneNumber: customerData.phoneNumber,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a customer without phone number', async () => {
      const customerData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phoneNumber: null,
      };

      const result = await caller.customers.create(customerData);

      expect(result).toMatchObject({
        id: expect.any(Number),
        name: customerData.name,
        email: customerData.email,
        phoneNumber: null,
      });
    });

    it('should throw error for invalid email', async () => {
      const customerData = {
        name: 'Invalid Email',
        email: 'invalid-email',
        phoneNumber: null,
      };

      await expect(caller.customers.create(customerData)).rejects.toThrow();
    });

    it('should throw error for empty name', async () => {
      const customerData = {
        name: '',
        email: 'test@example.com',
        phoneNumber: null,
      };

      await expect(caller.customers.create(customerData)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array when no customers exist', async () => {
      const result = await caller.customers.list();
      expect(result).toEqual([]);
    });

    it('should return all customers ordered by creation date desc', async () => {
      // Create multiple customers
      const customer1 = await caller.customers.create({
        name: 'Customer 1',
        email: 'customer1@example.com',
        phoneNumber: null,
      });

      const customer2 = await caller.customers.create({
        name: 'Customer 2',
        email: 'customer2@example.com',
        phoneNumber: '+1234567890',
      });

      const result = await caller.customers.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(customer2.id); // Most recent first
      expect(result[1]?.id).toBe(customer1.id);
    });
  });

  describe('update', () => {
    it('should update customer with valid data', async () => {
      const customer = await caller.customers.create({
        name: 'Original Name',
        email: 'original@example.com',
        phoneNumber: null,
      });

      const updateData = {
        id: customer.id,
        name: 'Updated Name',
        phoneNumber: '+9876543210',
      };

      const result = await caller.customers.update(updateData);

      expect(result).toMatchObject({
        id: customer.id,
        name: updateData.name,
        email: customer.email, // Email should remain unchanged
        phoneNumber: updateData.phoneNumber,
      });
    });

    it('should throw error for non-existent customer', async () => {
      const updateData = {
        id: 99999,
        name: 'Non-existent',
        phoneNumber: null,
      };

      await expect(caller.customers.update(updateData)).rejects.toThrow();
    });

    it('should throw error for empty name', async () => {
      const customer = await caller.customers.create({
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: null,
      });

      const updateData = {
        id: customer.id,
        name: '',
        phoneNumber: null,
      };

      await expect(caller.customers.update(updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing customer', async () => {
      const customer = await caller.customers.create({
        name: 'To Delete',
        email: 'delete@example.com',
        phoneNumber: null,
      });

      const result = await caller.customers.delete(customer.id);

      expect(result).toMatchObject({
        id: customer.id,
        name: customer.name,
        email: customer.email,
      });

      // Verify customer is deleted
      const customers = await caller.customers.list();
      expect(customers).toHaveLength(0);
    });

    it('should throw error for non-existent customer', async () => {
      await expect(caller.customers.delete(99999)).rejects.toThrow();
    });

    it('should handle string ID input (coerced to number)', async () => {
      const customer = await caller.customers.create({
        name: 'String ID Test',
        email: 'stringid@example.com',
        phoneNumber: null,
      });

      // The router uses z.coerce.number() so string should work
      const result = await caller.customers.delete(customer.id.toString() as any);

      expect(result).toMatchObject({
        id: customer.id,
      });
    });
  });
}); 