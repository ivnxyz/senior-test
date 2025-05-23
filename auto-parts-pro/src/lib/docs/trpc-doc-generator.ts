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

    const endpoint: EndpointInfo = {
      name: endpointName,
      type: typedProcedure._def?.type ?? 'query',
      path: `/api/trpc/${procedurePath}`,
      inputSchema: typedProcedure._def?.inputs?.[0] 
        ? convertZodToJsonSchema(typedProcedure._def.inputs[0])
        : undefined,
      outputSchema: typedProcedure._def?.output
        ? convertZodToJsonSchema(typedProcedure._def.output)
        : undefined,
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