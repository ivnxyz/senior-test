"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStatusBadgeClass } from "@/lib/utils";

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: number;
  currentStatus: Status;
  onStatusUpdated?: () => void;
}

const statusOptions: { value: Status; label: string; disabled?: boolean }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function UpdateStatusDialog({
  open,
  onOpenChange,
  repairOrderId,
  currentStatus,
  onStatusUpdated,
}: UpdateStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<Status | undefined>();
  const [showRestockConfirm, setShowRestockConfirm] = useState(false);

  const utils = api.useUtils();

  const updateStatusMutation = api.repairOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      onOpenChange(false);
      setSelectedStatus(undefined);
      onStatusUpdated?.();
      // Invalidate queries to refresh data
      void utils.repairOrders.list.invalidate();
      void utils.repairOrders.find.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to update status");
    },
  });

  const handleSubmit = () => {
    if (!selectedStatus) return;

    // If transitioning from IN_PROGRESS to CANCELLED, show restock confirmation
    if (currentStatus === "IN_PROGRESS" && selectedStatus === "CANCELLED") {
      setShowRestockConfirm(true);
      return;
    }

    // For all other transitions, update directly
    updateStatusMutation.mutate({
      id: repairOrderId,
      status: selectedStatus,
    });
  };

  const handleRestockConfirm = (restockParts: boolean) => {
    setShowRestockConfirm(false);
    updateStatusMutation.mutate({
      id: repairOrderId,
      status: "CANCELLED",
      restockParts,
    });
  };

  const getAvailableStatuses = () => {
    // Once cancelled, cannot be updated
    if (currentStatus === "CANCELLED") {
      return [];
    }

    return statusOptions.filter((option) => option.value !== currentStatus);
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Repair Order Status</DialogTitle>
            <DialogDescription>
              Change the status of repair order #{repairOrderId}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">
                Current Status:
              </label>
              <div className="col-span-3">
                <Badge className={getStatusBadgeClass(currentStatus)}>
                  {currentStatus.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {currentStatus === "CANCELLED" ? (
              <div className="col-span-4 text-center">
                <p className="text-muted-foreground text-sm">
                  This repair order is cancelled and cannot be updated.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  New Status:
                </label>
                <div className="col-span-3">
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: Status) => setSelectedStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem
                          key={status.value}
                          value={status.value}
                          disabled={status.disabled}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {currentStatus !== "CANCELLED" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Status
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Restock Confirmation Dialog */}
      <AlertDialog
        open={showRestockConfirm}
        onOpenChange={setShowRestockConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restock Parts</AlertDialogTitle>
            <AlertDialogDescription>
              This repair order is currently in progress. Do you want to return
              the parts back to stock when cancelling this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleRestockConfirm(false)}>
              No, don&apos;t restock
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRestockConfirm(true)}>
              Yes, restock parts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
