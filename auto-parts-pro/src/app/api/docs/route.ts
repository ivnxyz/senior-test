import { NextResponse } from 'next/server';
import { appRouter } from '@/server/api/root';
import { generateTRPCDocumentation, convertToOpenAPIFormat } from '@/lib/docs/trpc-doc-generator';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'json';

  try {
    const documentation = generateTRPCDocumentation(appRouter, {
      title: 'Auto Parts Pro API',
      version: '1.0.0',
      description: 'Comprehensive API for managing auto parts, customers, vehicles, and repair orders',
      baseUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    });

    if (format === 'openapi') {
      const openApiDoc = convertToOpenAPIFormat(documentation);
      return NextResponse.json(openApiDoc, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    return NextResponse.json(documentation, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate documentation' },
      { status: 500 }
    );
  }
} 