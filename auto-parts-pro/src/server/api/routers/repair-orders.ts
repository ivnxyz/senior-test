import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { repairOrderSchema } from "@/lib/validations/repair-order";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import solver from 'javascript-lp-solver';
import type { Model } from 'javascript-lp-solver';

export const repairOrdersRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.repairOrder.findMany({
      where: { deletedAt: null },
      include: {
        vehicle: {
          include: {
            make: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),
  find: publicProcedure
    .input(
      z.object({
        id: z.number().int().optional(),
        vehicleId: z.number().int().optional(),
      }).refine(data => data.id !== undefined || data.vehicleId !== undefined, {
        message: "Either id or vehicleId must be provided"
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, vehicleId } = input;

      const where: Prisma.RepairOrderWhereInput = {};
      
      // If id is provided, find a single repair order
      if (id) {
        where.id = id;
      }
      
      // If vehicleId is provided, find all repair orders for that vehicle
      if (vehicleId) {
        where.vehicleId = vehicleId;
      }

      return await ctx.db.repairOrder.findMany({
        where,
        include: {
          vehicle: {
            include: {
              make: true,
            },
          },
          customer: true,
          orderDetails: {
            include: {
              part: true,
            },
          },
          labors: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),
  create: publicProcedure
    .input(repairOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { orderDetails, labors, ...repairOrderData } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Create the repair order
        const repairOrder = await tx.repairOrder.create({
          data: {
            ...repairOrderData,
            status: "PENDING", // Default status is PENDING
            orderDetails: {
              create: orderDetails.map((detail) => ({
                partId: detail.partId,
                quantity: detail.quantity,
                costPrice: detail.costPrice,
                sellPrice: detail.sellPrice,
                profit: detail.profit,
              })),
            },
            labors: {
              create: labors.map((labor) => ({
                name: labor.name,
                description: labor.description,
                hours: labor.hours,
                rate: labor.rate,
                total: labor.total,
              })),
            },
          },
          include: {
            vehicle: true,
            customer: true,
            orderDetails: {
              include: {
                part: true,
              },
            },
            labors: true,
          },
        });

        return repairOrder;
      });
    }),
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
        restockParts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, restockParts } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Get current repair order with details
        const currentOrder = await tx.repairOrder.findUnique({
          where: { id },
          include: {
            orderDetails: {
              include: {
                part: true,
              },
            },
          },
        });

        if (!currentOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repair order not found",
          });
        }

        // Check if order is already cancelled (cannot be updated)
        if (currentOrder.status === "CANCELLED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot update a cancelled repair order",
          });
        }

        // Handle PENDING to IN_PROGRESS transition
        if (currentOrder.status === "PENDING" && status === "IN_PROGRESS") {
          // Check if there are enough parts in stock
          for (const orderDetail of currentOrder.orderDetails) {
            const part = await tx.part.findUnique({
              where: { id: orderDetail.partId },
            });

            if (!part) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Part ${orderDetail.part.name} not found`,
              });
            }

            if (part.availableQuantity < orderDetail.quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Not enough stock for part "${part.name}". Available: ${part.availableQuantity}, Required: ${orderDetail.quantity}`,
              });
            }
          }

          // Deduct parts from stock
          for (const orderDetail of currentOrder.orderDetails) {
            await tx.part.update({
              where: { id: orderDetail.partId },
              data: {
                availableQuantity: {
                  decrement: orderDetail.quantity,
                },
              },
            });
          }
        }

        // Handle IN_PROGRESS to CANCELLED transition with restocking
        if (
          currentOrder.status === "IN_PROGRESS" &&
          status === "CANCELLED" &&
          restockParts
        ) {
          // Return parts to stock
          for (const orderDetail of currentOrder.orderDetails) {
            await tx.part.update({
              where: { id: orderDetail.partId },
              data: {
                availableQuantity: {
                  increment: orderDetail.quantity,
                },
              },
            });
          }
        }

        // Update the repair order status
        const updatedOrder = await tx.repairOrder.update({
          where: { id },
          data: { status },
          include: {
            vehicle: {
              include: {
                make: true,
              },
            },
            customer: true,
            orderDetails: {
              include: {
                part: true,
              },
            },
            labors: true,
          },
        });

        return updatedOrder;
      });
    }),
  optimize: publicProcedure
    .input(
      z.object({
        objective: z.enum(['profit', 'priority']).default('profit'),
        status: z.enum(['PENDING', 'IN_PROGRESS']).optional().default('PENDING'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Get current inventory
      const parts = await ctx.db.part.findMany({
        where: { deletedAt: null },
        select: { id: true, availableQuantity: true, name: true },
      });

      // 2. Get pending orders with their parts
      const orders = await ctx.db.repairOrder.findMany({
        where: { 
          status: input.status,
          deletedAt: null 
        },
        select: {
          id: true,
          profit: true,
          priority: true,
          orderDetails: {
            where: { deletedAt: null },
            select: { partId: true, quantity: true },
          },
        },
      });

      // 3. Build ILP model
      const model: Model = {
        optimize: input.objective,
        opType: 'max',
        constraints: {},
        variables: {},
        ints: {},
      };

      // a) Stock constraints
      for (const part of parts) {
        model.constraints[`part_${part.id}`] = { max: part.availableQuantity };
      }

      // b) Binary variables per order
      for (const order of orders) {
        const varName = `order_${order.id}`;
        model.variables[varName] = {};
        if (model.ints) {
          model.ints[varName] = 1; // 0-1 binary variable
        }
        
        // Objective function
        model.variables[varName][input.objective] =
          input.objective === 'profit' ? order.profit : priorityWeight(order.priority);
        
        // Parts consumption
        for (const orderDetail of order.orderDetails) {
          model.variables[varName][`part_${orderDetail.partId}`] = orderDetail.quantity;
        }
      }

      // 4. Execute solver
      const solution = solver.Solve(model);

      // 5. Parse results
      const selectedOrderIds: number[] = [];
      for (const key of Object.keys(solution)) {
        if (key.startsWith('order_') && solution[key] === 1) {
          selectedOrderIds.push(parseInt(key.replace('order_', '')));
        }
      }

      const skippedOrderIds = orders
        .filter((order) => !selectedOrderIds.includes(order.id))
        .map((order) => order.id);

      // 6. Calculate resulting inventory
      const inventoryAfter: Record<string, number> = {};
      for (const part of parts) {
        inventoryAfter[part.name] = part.availableQuantity;
      }

      for (const order of orders) {
        if (selectedOrderIds.includes(order.id)) {
          for (const orderDetail of order.orderDetails) {
            const part = parts.find((p) => p.id === orderDetail.partId);
            if (part) {
              inventoryAfter[part.name] = (inventoryAfter[part.name] ?? 0) - orderDetail.quantity;
            }
          }
        }
      }

      return {
        selectedOrderIds,
        skippedOrderIds,
        objectiveValue: solution.result ?? 0,
        inventoryAfter,
      };
    }),
});

// Helper function to convert priority to weight
function priorityWeight(priority: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  return priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1;
} 