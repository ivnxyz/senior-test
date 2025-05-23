import type { AnyRouter, ProcedureType } from '@trpc/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodSchema } from 'zod';

export interface EndpointInfo {
  name: string;
  type: ProcedureType;
  path: string;
  description?: string;
  inputSchema?: any;
  outputSchema?: any;
  examples?: {
    input?: any;
    output?: any;
  };
  returnType?: string;
}

export interface RouterInfo {
  name: string;
  endpoints: EndpointInfo[];
  description?: string;
}

export interface ApiDocumentation {
  title: string;
  version: string;
  description: string;
  routers: RouterInfo[];
  baseUrl: string;
  generatedAt: string;
}

/**
 * Extract documentation from a tRPC router
 */
export function generateTRPCDocumentation(
  router: AnyRouter,
  options: {
    title: string;
    version: string;
    description: string;
    baseUrl: string;
  }
): ApiDocumentation {
  const routers: RouterInfo[] = [];

  // Extract router information
  const procedures = router._def.procedures;
  const routerMap = new Map<string, EndpointInfo[]>();

  // Group procedures by router
  for (const [procedurePath, procedure] of Object.entries(procedures)) {
    const pathParts = procedurePath.split('.');
    const routerName = pathParts[0] ?? 'root';
    const endpointName = pathParts.slice(1).join('.');

    if (!routerMap.has(routerName)) {
      routerMap.set(routerName, []);
    }

    // Type assertion for procedure since it's from the tRPC internal structure
    const typedProcedure = procedure as any;

    // Enhanced debugging and inspection
    console.log(`Inspecting procedure: ${procedurePath}`, {
      type: typedProcedure._def?.type,
      inputs: typedProcedure._def?.inputs,
      output: typedProcedure._def?.output,
      meta: typedProcedure._def?.meta,
      hasOutput: !!typedProcedure._def?.output,
    });

    const inputSchema = typedProcedure._def?.inputs?.[0] 
      ? convertZodToJsonSchema(typedProcedure._def.inputs[0])
      : undefined;

    let outputSchema: any = undefined;
    let returnType = 'any';

    // Try to extract output schema
    if (typedProcedure._def?.output) {
      outputSchema = convertZodToJsonSchema(typedProcedure._def.output);
    } else {
      // If no explicit output schema, infer from the endpoint type and context
      outputSchema = inferOutputSchema(routerName, endpointName, typedProcedure._def?.type);
      returnType = inferReturnType(routerName, endpointName, typedProcedure._def?.type);
    }

    const endpoint: EndpointInfo = {
      name: endpointName,
      type: typedProcedure._def?.type ?? 'query',
      path: `/api/trpc/${procedurePath}`,
      inputSchema,
      outputSchema,
      returnType,
      description: generateEndpointDescription(routerName, endpointName, typedProcedure._def?.type),
    };

    routerMap.get(routerName)!.push(endpoint);
  }

  // Convert map to RouterInfo array
  for (const [routerName, endpoints] of routerMap.entries()) {
    routers.push({
      name: routerName,
      endpoints: endpoints.sort((a, b) => a.name.localeCompare(b.name)),
      description: getRouterDescription(routerName),
    });
  }

  return {
    title: options.title,
    version: options.version,
    description: options.description,
    baseUrl: options.baseUrl,
    routers: routers.sort((a, b) => a.name.localeCompare(b.name)),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Infer output schema based on router and endpoint patterns
 */
function inferOutputSchema(routerName: string, endpointName: string, type?: string): any {
  const commonResponses = {
    list: {
      type: 'array',
      items: { type: 'object' },
      description: `Array of ${routerName} objects`
    },
    create: {
      type: 'object',
      description: `Created ${routerName.slice(0, -1)} object with ID and timestamps`,
      properties: {
        id: { type: 'number', description: 'Unique identifier' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    update: {
      type: 'object',
      description: `Updated ${routerName.slice(0, -1)} object`,
      properties: {
        id: { type: 'number', description: 'Unique identifier' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    delete: {
      type: 'object',
      description: `Deleted ${routerName.slice(0, -1)} object`,
      properties: {
        id: { type: 'number', description: 'ID of deleted record' }
      }
    }
  };

  // Check for common patterns
  if (endpointName in commonResponses) {
    return commonResponses[endpointName as keyof typeof commonResponses];
  }

  // Router-specific schemas
  switch (routerName) {
    case 'customers':
      return getCustomerOutputSchema(endpointName);
    case 'parts':
      return getPartOutputSchema(endpointName);
    case 'vehicles':
      return getVehicleOutputSchema(endpointName);
    case 'makes':
      return getMakeOutputSchema(endpointName);
    case 'repairOrders':
      return getRepairOrderOutputSchema(endpointName);
    case 'labors':
      return getLaborOutputSchema(endpointName);
    case 'orderDetails':
      return getOrderDetailOutputSchema(endpointName);
    default:
      return {
        type: 'object',
        description: `${type === 'query' ? 'Query' : 'Mutation'} result`
      };
  }
}

/**
 * Generate specific output schemas for each router
 */
function getCustomerOutputSchema(endpointName: string): any {
  const baseCustomer = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Customer ID' },
      name: { type: 'string', description: 'Customer name' },
      email: { type: 'string', format: 'email', description: 'Customer email' },
      phoneNumber: { type: ['string', 'null'], description: 'Customer phone number' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  switch (endpointName) {
    case 'list':
      return { type: 'array', items: baseCustomer };
    case 'create':
    case 'update':
      return baseCustomer;
    case 'delete':
      return { type: 'object', properties: { id: { type: 'number' } } };
    default:
      return baseCustomer;
  }
}

function getPartOutputSchema(endpointName: string): any {
  const basePart = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Part ID' },
      name: { type: 'string', description: 'Part name' },
      partNumber: { type: 'string', description: 'Part number/SKU' },
      price: { type: 'number', description: 'Part price' },
      quantity: { type: 'number', description: 'Available quantity' },
      description: { type: ['string', 'null'], description: 'Part description' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  switch (endpointName) {
    case 'list':
      return { type: 'array', items: basePart };
    case 'create':
    case 'update':
      return basePart;
    case 'delete':
      return { type: 'object', properties: { id: { type: 'number' } } };
    default:
      return basePart;
  }
}

function getVehicleOutputSchema(endpointName: string): any {
  const baseVehicle = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Vehicle ID' },
      make: { type: 'string', description: 'Vehicle make' },
      model: { type: 'string', description: 'Vehicle model' },
      year: { type: 'number', description: 'Vehicle year' },
      vin: { type: 'string', description: 'Vehicle identification number' },
      customerId: { type: 'number', description: 'Owner customer ID' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  switch (endpointName) {
    case 'list':
      return { type: 'array', items: baseVehicle };
    default:
      return baseVehicle;
  }
}

function getMakeOutputSchema(endpointName: string): any {
  const baseMake = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Make ID' },
      name: { type: 'string', description: 'Make name' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  return endpointName === 'list' ? { type: 'array', items: baseMake } : baseMake;
}

function getRepairOrderOutputSchema(endpointName: string): any {
  const baseRepairOrder = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Repair order ID' },
      vehicleId: { type: 'number', description: 'Vehicle ID' },
      customerId: { type: 'number', description: 'Customer ID' },
      status: { type: 'string', description: 'Order status' },
      totalAmount: { type: 'number', description: 'Total amount' },
      description: { type: 'string', description: 'Work description' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  return endpointName === 'list' ? { type: 'array', items: baseRepairOrder } : baseRepairOrder;
}

function getLaborOutputSchema(endpointName: string): any {
  const baseLabor = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Labor ID' },
      name: { type: 'string', description: 'Labor type name' },
      rate: { type: 'number', description: 'Hourly rate' },
      description: { type: 'string', description: 'Labor description' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  return endpointName === 'list' ? { type: 'array', items: baseLabor } : baseLabor;
}

function getOrderDetailOutputSchema(endpointName: string): any {
  const baseOrderDetail = {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Order detail ID' },
      repairOrderId: { type: 'number', description: 'Repair order ID' },
      partId: { type: ['number', 'null'], description: 'Part ID if applicable' },
      laborId: { type: ['number', 'null'], description: 'Labor ID if applicable' },
      quantity: { type: 'number', description: 'Quantity' },
      unitPrice: { type: 'number', description: 'Unit price' },
      totalPrice: { type: 'number', description: 'Total price' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  return endpointName === 'list' ? { type: 'array', items: baseOrderDetail } : baseOrderDetail;
}

/**
 * Infer return type description
 */
function inferReturnType(routerName: string, endpointName: string, type?: string): string {
  if (endpointName === 'list') {
    return `${routerName.charAt(0).toUpperCase() + routerName.slice(1, -1)}[]`;
  }
  
  if (endpointName === 'delete') {
    return `{ id: number }`;
  }

  return `${routerName.charAt(0).toUpperCase() + routerName.slice(1, -1)}`;
}

/**
 * Generate endpoint description
 */
function generateEndpointDescription(routerName: string, endpointName: string, type?: string): string {
  const entityName = routerName.slice(0, -1); // Remove 's' from plural
  const actions: Record<string, string> = {
    list: `Get all ${routerName}`,
    create: `Create a new ${entityName}`,
    update: `Update an existing ${entityName}`,
    delete: `Delete a ${entityName}`,
    byId: `Get a ${entityName} by ID`,
  };

  return actions[endpointName] ?? `${type === 'query' ? 'Query' : 'Mutate'} ${endpointName}`;
}

/**
 * Convert Zod schema to JSON Schema
 */
function convertZodToJsonSchema(schema: ZodSchema): any {
  try {
    return zodToJsonSchema(schema);
  } catch (error) {
    console.warn('Failed to convert schema to JSON Schema:', error);
    return { type: 'unknown', description: 'Schema conversion failed' };
  }
}

/**
 * Get router description based on router name
 */
function getRouterDescription(routerName: string): string {
  const descriptions: Record<string, string> = {
    customers: 'Manage customer information, including creation, updates, and deletion',
    makes: 'Manage vehicle makes and manufacturer information',
    vehicles: 'Handle vehicle data including make, model, year, and VIN information',
    parts: 'Manage auto parts inventory, pricing, and availability',
    repairOrders: 'Create and manage repair orders for vehicles',
    labors: 'Manage labor types, rates, and time tracking',
    orderDetails: 'Handle detailed information about repair order items and services',
  };

  return descriptions[routerName] ?? `API endpoints for ${routerName} management`;
}

/**
 * Generate example values for common field types
 */
export function generateExampleValue(fieldName: string, fieldType: string): any {
  const examples: Record<string, any> = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1-555-123-4567',
    price: 29.99,
    quantity: 2,
    description: 'High-quality auto part',
    vin: '1HGBH41JXMN109186',
    year: 2023,
    make: 'Toyota',
    model: 'Camry',
    partNumber: 'TY-12345',
    laborRate: 95.00,
    hours: 2.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try to match by field name first
  if (examples[fieldName]) {
    return examples[fieldName];
  }

  // Fallback to type-based examples
  switch (fieldType) {
    case 'string':
      return 'Example string';
    case 'number':
      return 123;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

/**
 * Convert tRPC documentation to OpenAPI format (simplified)
 */
export function convertToOpenAPIFormat(doc: ApiDocumentation): any {
  const paths: any = {};

  doc.routers.forEach(router => {
    router.endpoints.forEach(endpoint => {
      const method = endpoint.type === 'query' ? 'get' : 'post';
      const path = endpoint.path;

      paths[path] ??= {};

      paths[path][method] = {
        summary: `${endpoint.type === 'query' ? 'Get' : 'Execute'} ${router.name}.${endpoint.name}`,
        description: endpoint.description ?? `${endpoint.type} operation for ${endpoint.name}`,
        tags: [router.name],
        ...(endpoint.inputSchema && {
          requestBody: {
            content: {
              'application/json': {
                schema: endpoint.inputSchema,
              },
            },
          },
        }),
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: endpoint.outputSchema ?? { type: 'object' },
              },
            },
          },
        },
      };
    });
  });

  return {
    openapi: '3.0.3',
    info: {
      title: doc.title,
      version: doc.version,
      description: doc.description,
    },
    servers: [
      {
        url: doc.baseUrl,
        description: 'API Server',
      },
    ],
    paths,
    tags: doc.routers.map(router => ({
      name: router.name,
      description: router.description,
    })),
  };
} 