"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  FileText,
  Globe,
  Download,
  ExternalLink,
  Info,
} from "lucide-react";
import type {
  ApiDocumentation,
  EndpointInfo,
} from "@/lib/docs/trpc-doc-generator";

export default function DocsPage() {
  const [documentation, setDocumentation] = useState<ApiDocumentation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/docs");
      if (!response.ok) {
        throw new Error("Failed to fetch documentation");
      }
      const data = await response.json();
      setDocumentation(data);
      if (data.routers.length > 0) {
        setSelectedRouter(data.routers[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const downloadOpenAPI = async () => {
    try {
      const response = await fetch("/api/docs?format=openapi");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "openapi.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download OpenAPI spec:", err);
    }
  };

  const renderJsonSchema = (schema: any, title: string) => {
    if (!schema)
      return <span className="text-gray-500">No schema defined</span>;

    return (
      <div>
        {schema.description && (
          <div className="mb-3 rounded border-l-4 border-blue-400 bg-blue-50 p-2">
            <div className="flex items-center gap-2 text-blue-800">
              <Info className="h-4 w-4" />
              <span className="font-medium">Description:</span>
            </div>
            <p className="mt-1 text-blue-700">{schema.description}</p>
          </div>
        )}
        <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </div>
    );
  };

  const renderEndpoint = (endpoint: EndpointInfo) => (
    <Card key={endpoint.name} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {endpoint.name}
            <Badge
              variant={endpoint.type === "query" ? "default" : "secondary"}
            >
              {endpoint.type.toUpperCase()}
            </Badge>
            {endpoint.returnType && (
              <Badge variant="outline" className="font-mono text-xs">
                → {endpoint.returnType}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(endpoint.path)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          <div className="space-y-1">
            <code className="rounded bg-gray-100 px-2 py-1 text-sm">
              {endpoint.path}
            </code>
            {endpoint.description && (
              <p className="mt-1 text-gray-600">{endpoint.description}</p>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="input" className="w-full">
          <TabsList>
            <TabsTrigger value="input">Input Schema</TabsTrigger>
            <TabsTrigger value="output">Output Schema</TabsTrigger>
            <TabsTrigger value="example">Usage Example</TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-4">
            <h4 className="mb-2 font-semibold">Input Schema:</h4>
            {renderJsonSchema(endpoint.inputSchema, "Input")}
          </TabsContent>
          <TabsContent value="output" className="mt-4">
            <h4 className="mb-2 font-semibold">Output Schema:</h4>
            {renderJsonSchema(endpoint.outputSchema, "Output")}
          </TabsContent>
          <TabsContent value="example" className="mt-4">
            <h4 className="mb-2 font-semibold">tRPC Usage Example:</h4>
            <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-sm text-green-400">
              {endpoint.type === "query"
                ? `// Client-side usage
const result = await trpc.${selectedRouter}.${endpoint.name}.useQuery(${
                    endpoint.inputSchema ? "{ /* input data */ }" : ""
                  });

// Server-side usage  
const result = await api.${selectedRouter}.${endpoint.name}(${
                    endpoint.inputSchema ? "{ /* input data */ }" : ""
                  });`
                : `// Client-side usage
const mutation = trpc.${selectedRouter}.${endpoint.name}.useMutation();
mutation.mutate(${endpoint.inputSchema ? "{ /* input data */ }" : ""});

// Server-side usage
const result = await api.${selectedRouter}.${endpoint.name}(${
                    endpoint.inputSchema ? "{ /* input data */ }" : ""
                  });`}
            </pre>

            <div className="mt-4">
              <h5 className="mb-2 font-medium">Example Input/Output:</h5>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {endpoint.inputSchema && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">
                      Input:
                    </p>
                    <pre className="rounded bg-blue-50 p-2 text-xs">
                      {generateExampleInput(endpoint.inputSchema)}
                    </pre>
                  </div>
                )}
                {endpoint.outputSchema && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">
                      Output:
                    </p>
                    <pre className="rounded bg-green-50 p-2 text-xs">
                      {generateExampleOutput(endpoint.outputSchema)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const generateExampleInput = (schema: any): string => {
    if (!schema?.properties) return "// No input required";

    const example: any = {};
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      if (key === "id") return; // Skip ID in input examples

      switch (prop.type) {
        case "string":
          if (prop.format === "email") example[key] = "user@example.com";
          else if (key.includes("phone")) example[key] = "+1-555-123-4567";
          else if (key.includes("name")) example[key] = "Example Name";
          else example[key] = "Example string";
          break;
        case "number":
          example[key] =
            key.includes("price") || key.includes("amount") ? 29.99 : 123;
          break;
        case "boolean":
          example[key] = true;
          break;
        default:
          if (Array.isArray(prop.type) && prop.type.includes("null")) {
            example[key] = null;
          }
      }
    });

    return JSON.stringify(example, null, 2);
  };

  const generateExampleOutput = (schema: any): string => {
    if (!schema) return "// Output type inferred";

    if (schema.type === "array") {
      return `[
  // Array of ${schema.items?.description ?? "objects"}
  ${generateExampleOutput(schema.items)}
]`;
    }

    if (schema.properties) {
      const example: any = {};
      Object.entries(schema.properties).forEach(
        ([key, prop]: [string, any]) => {
          switch (prop.type) {
            case "string":
              if (prop.format === "date-time")
                example[key] = new Date().toISOString();
              else if (prop.format === "email")
                example[key] = "user@example.com";
              else if (key.includes("name")) example[key] = "Example Name";
              else example[key] = "Example string";
              break;
            case "number":
              example[key] =
                key === "id"
                  ? 1
                  : key.includes("price") || key.includes("amount")
                    ? 29.99
                    : 123;
              break;
            case "boolean":
              example[key] = true;
              break;
            default:
              if (Array.isArray(prop.type) && prop.type.includes("null")) {
                example[key] = null;
              }
          }
        },
      );

      return JSON.stringify(example, null, 2);
    }

    return JSON.stringify({ message: "Success" }, null, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading API documentation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchDocumentation} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!documentation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">No documentation available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRouterData = documentation.routers.find(
    (r) => r.name === selectedRouter,
  );

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{documentation.title}</h1>
            <p className="mt-2 text-gray-600">{documentation.description}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadOpenAPI} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download OpenAPI
            </Button>
            <Button asChild variant="outline">
              <a href="/api/docs" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                JSON API
              </a>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Version: {documentation.version}</span>
          <span>•</span>
          <span>Base URL: {documentation.baseUrl}</span>
          <span>•</span>
          <span>
            Generated: {new Date(documentation.generatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar - Router Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Routers
              </CardTitle>
              <CardDescription>
                {documentation.routers.length} router
                {documentation.routers.length !== 1 ? "s" : ""} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {documentation.routers.map((router) => (
                    <Button
                      key={router.name}
                      variant={
                        selectedRouter === router.name ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => setSelectedRouter(router.name)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {router.name}
                      <Badge
                        variant={
                          selectedRouter === router.name ? "default" : "outline"
                        }
                        className="ml-auto"
                      >
                        {router.endpoints.length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Router Details */}
        <div className="lg:col-span-3">
          {selectedRouterData && (
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{selectedRouterData.name} Router</CardTitle>
                  <CardDescription>
                    {selectedRouterData.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge>
                      {selectedRouterData.endpoints.length} endpoints
                    </Badge>
                    <Badge variant="outline">
                      {
                        selectedRouterData.endpoints.filter(
                          (e) => e.type === "query",
                        ).length
                      }{" "}
                      queries
                    </Badge>
                    <Badge variant="outline">
                      {
                        selectedRouterData.endpoints.filter(
                          (e) => e.type === "mutation",
                        ).length
                      }{" "}
                      mutations
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {selectedRouterData.endpoints.map(renderEndpoint)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
