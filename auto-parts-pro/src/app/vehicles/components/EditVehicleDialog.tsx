"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Vehicle } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { editVehicleSchema } from "@/lib/validations/vehicle";
import { MakeSelector } from "@/components/make-selector";
import { CustomerSelector } from "@/components/customer-selector";

type FormData = z.infer<typeof editVehicleSchema>;

interface EditVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  vehicle?: Vehicle | null;
}

export const EditVehicleDialog = ({
  isOpen,
  setIsOpen,
  vehicle,
}: EditVehicleDialogProps) => {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      id: vehicle?.id,
      customerId: vehicle?.customerId,
      makeId: vehicle?.makeId,
      model: vehicle?.model,
      year: vehicle?.year,
      licensePlate: vehicle?.licensePlate,
    },
  });

  const selectedCustomer = watch("customerId");
  const selectedMake = watch("makeId");

  // Handle update
  const updateVehicleMutation = api.vehicles.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");

      // Reload page
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while updating vehicle");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit vehicle</DialogTitle>
        </DialogHeader>
        {/* Main content */}
        <div className="mt-3 grid gap-3">
          {/* Customer */}
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="customerId" required>
              Customer
            </Label>
            <CustomerSelector
              showLabel={false}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={(customerId) => {
                setValue("customerId", customerId, {
                  shouldValidate: true,
                });
              }}
            />
            {errors?.customerId && (
              <p className="px-1 text-xs text-red-600">
                {errors.customerId.message}
              </p>
            )}
          </div>
          {/* Make */}
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="makeId" required>
              Make
            </Label>
            <MakeSelector
              showLabel={false}
              selectedMake={selectedMake}
              setSelectedMake={(makeId) => {
                setValue("makeId", makeId, { shouldValidate: true });
              }}
            />
          </div>
          {/* Model */}
          <div className="flex w-full flex-col">
            <Label htmlFor="model" required>
              Model
            </Label>
            <Input
              id="model"
              placeholder=""
              type="text"
              autoCorrect="off"
              disabled={updateVehicleMutation.isPending}
              {...register("model")}
              className="mt-2"
              required
            />
            {errors?.model && (
              <p className="px-1 text-xs text-red-600">
                {errors.model.message}
              </p>
            )}
          </div>
          {/* Year */}
          <div className="flex w-full flex-col">
            <Label htmlFor="year" required>
              Year
            </Label>
            <Input
              id="year"
              placeholder=""
              type="number"
              autoCorrect="off"
              disabled={updateVehicleMutation.isPending}
              {...register("year")}
              className="mt-2"
            />
            {errors?.year && (
              <p className="px-1 text-xs text-red-600">{errors.year.message}</p>
            )}
          </div>
          {/* License plate */}
          <div className="flex w-full flex-col">
            <Label htmlFor="licensePlate" required>
              License plate
            </Label>
            <Input
              id="licensePlate"
              placeholder=""
              type="text"
              autoCorrect="off"
              disabled={updateVehicleMutation.isPending}
              {...register("licensePlate")}
              className="mt-2"
            />
            {errors?.licensePlate && (
              <p className="px-1 text-xs text-red-600">
                {errors.licensePlate.message}
              </p>
            )}
          </div>
        </div>
        {/* Footer */}
        <DialogFooter>
          <Button
            type="submit"
            disabled={updateVehicleMutation.isPending}
            onClick={handleSubmit((data) => updateVehicleMutation.mutate(data))}
          >
            {updateVehicleMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
