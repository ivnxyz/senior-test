"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { customerSchema } from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { CustomerSelector } from "@/components/customer-selector";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { MakeSelector } from "@/components/make-selector";

type FormData = z.infer<typeof vehicleSchema>;

interface NewVehicleDialogProps {
  secondary?: boolean;
  trigger?: React.ReactNode;
}

export const NewVehicleDialog = ({
  secondary = false,
  trigger,
}: NewVehicleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const selectedCustomer = watch("customerId");
  const selectedMake = watch("makeId");

  // Create vehicle mutation
  const createVehicleMutation = api.vehicles.create.useMutation({
    onSuccess: () => {
      toast.success("Vehicle created successfully");
      window.location.reload();
    },
    onError: () => {
      toast.error("An error ocurred while creating the vehicle");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={secondary ? "outline" : "default"}>
            Add vehicle <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>New vehicle</DialogTitle>
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
              disabled={createVehicleMutation.isPending}
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
              disabled={createVehicleMutation.isPending}
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
              disabled={createVehicleMutation.isPending}
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
            disabled={createVehicleMutation.isPending}
            onClick={handleSubmit((data: FormData) =>
              createVehicleMutation.mutate(data),
            )}
          >
            {createVehicleMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
