"use client";

import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RepairOrderCard } from "@/app/repair-orders/components/repair-order-card";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { UpdateStatusDialog } from "@/components/update-status-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [objective, setObjective] = useState<"profit" | "priority">("profit");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("");

  // Get optimization results
  const optimizeMutation = api.repairOrders.optimize.useMutation();

  // Get all repair orders to filter the optimized ones
  const { data: allOrders, isLoading: isLoadingOrders } =
    api.repairOrders.list.useQuery();

  // Trigger optimization on mount and when objective changes
  const handleOptimize = () => {
    optimizeMutation.mutate({ objective, status: "PENDING" });
  };

  // Get optimized orders by filtering all orders with selected IDs
  const optimizedOrders =
    allOrders?.filter((order) =>
      optimizeMutation.data?.selectedOrderIds?.includes(order.id),
    ) ?? [];

  const isLoading = optimizeMutation.isPending || isLoadingOrders;

  const handleUpdateStatus = (orderId: number, currentStatus: string) => {
    setSelectedOrderId(orderId);
    setSelectedOrderStatus(currentStatus);
    setStatusDialogOpen(true);
  };

  return (
    <div className="w-full p-4">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <span>Dashboard - Optimized Orders</span>
          <div className="flex items-center gap-2">
            {/* Strategy selector */}
            <Select
              value={objective}
              onValueChange={(value) =>
                setObjective(value as "profit" | "priority")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
            {/* Optimize button */}
            <Button onClick={handleOptimize} disabled={isLoading} size="sm">
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Optimize
            </Button>
          </div>
        </div>
      </Header>

      {/* Optimization Summary */}
      {optimizeMutation.data && !isLoading && (
        <div className="mx-auto mt-6 w-full max-w-6xl">
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Optimization Results</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Selected Orders
                  </p>
                  <p className="text-2xl font-bold">
                    {optimizeMutation.data.selectedOrderIds.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Skipped Orders
                  </p>
                  <p className="text-2xl font-bold">
                    {optimizeMutation.data.skippedOrderIds.length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {objective === "profit" ? "Total Profit" : "Priority Score"}
                  </p>
                  <p className="text-2xl font-bold">
                    {objective === "profit"
                      ? `$${optimizeMutation.data.objectiveValue.toFixed(2)}`
                      : optimizeMutation.data.objectiveValue}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-4">
        {isLoading && (
          <>
            <RepairOrderSkeleton />
            <RepairOrderSkeleton />
            <RepairOrderSkeleton />
          </>
        )}

        {!isLoading && !optimizeMutation.data && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Click &quot;Optimize&quot; to see the best orders to fulfill based
              on your selected criteria.
            </p>
          </div>
        )}

        {!isLoading &&
          optimizedOrders.length === 0 &&
          optimizeMutation.data && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No orders can be fulfilled with current inventory levels.
              </p>
            </div>
          )}

        {optimizedOrders
          .sort((a, b) => b.profit - a.profit)
          .map((order) => (
            <RepairOrderCard
              key={order.id}
              order={order}
              handleUpdateStatus={handleUpdateStatus}
            />
          ))}
      </div>

      {/* Status Update Dialog */}
      {selectedOrderId && (
        <UpdateStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          repairOrderId={selectedOrderId}
          currentStatus={
            selectedOrderStatus as
              | "PENDING"
              | "IN_PROGRESS"
              | "COMPLETED"
              | "CANCELLED"
          }
          onStatusUpdated={() => {
            // Reset state and refetch optimization
            setSelectedOrderId(null);
            setSelectedOrderStatus("");
            handleOptimize();
          }}
        />
      )}
    </div>
  );
}

function RepairOrderSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}
