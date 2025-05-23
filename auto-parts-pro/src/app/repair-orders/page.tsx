"use client";

import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/trpc/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateStatusDialog } from "@/components/update-status-dialog";
import { useState } from "react";
import { RepairOrderCard } from "./components/repair-order-card";

export default function RepairOrdersPage() {
  const { data: repairOrders, isLoading } = api.repairOrders.list.useQuery();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("");

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
          <span>Repair Orders</span>
          <Link href="/repair-orders/create">
            <Button>
              Add repair order <Plus className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Header>

      {/* Content */}
      <div className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-4">
        {isLoading && (
          <>
            <RepairOrderSkeleton />
            <RepairOrderSkeleton />
            <RepairOrderSkeleton />
          </>
        )}

        {repairOrders?.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No repair orders found. Create your first repair order.
            </p>
          </div>
        )}

        {repairOrders?.map((order) => (
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
            // Reset state
            setSelectedOrderId(null);
            setSelectedOrderStatus("");
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
