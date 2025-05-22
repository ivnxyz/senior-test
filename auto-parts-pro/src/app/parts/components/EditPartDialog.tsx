"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type * as z from "zod";

import { editPartSchema } from "@/lib/validations/parts";
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
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Part } from "@prisma/client";

type FormData = z.infer<typeof editPartSchema>;

interface EditPartDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  part: Part | null;
}

export function EditPartDialog({
  isOpen,
  setIsOpen,
  part,
}: EditPartDialogProps) {
  // Form state
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editPartSchema),
  });

  // Watch for changes to calculate profit
  const costPrice = useWatch({
    control,
    name: "costPrice",
    defaultValue: 0,
  });

  const sellPrice = useWatch({
    control,
    name: "sellPrice",
    defaultValue: 0,
  });

  // Calculate profit when prices change
  useEffect(() => {
    if (sellPrice && costPrice) {
      const calculatedProfit = sellPrice - costPrice;
      setValue("profit", calculatedProfit);
    }
  }, [costPrice, sellPrice, setValue]);

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (isOpen && part) {
      reset({
        id: part.id,
        name: part.name,
        description: part.description ?? undefined,
        costPrice: part.costPrice,
        sellPrice: part.sellPrice,
        profit: part.sellPrice - part.costPrice,
        availableQuantity: part.availableQuantity,
      });
    }
  }, [isOpen, part, reset]);

  // Update part mutation
  const updatePartMutation = api.parts.update.useMutation({
    onSuccess: () => {
      toast.success("Part updated successfully");
      setIsOpen(false);
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while updating the part");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit part</DialogTitle>
        </DialogHeader>
        {/* Main content */}
        <div className="mt-3 grid gap-3">
          {/* Name */}
          <div className="flex w-full flex-col">
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input
              id="name"
              placeholder=""
              type="text"
              autoCorrect="off"
              disabled={updatePartMutation.isPending}
              {...register("name")}
              className="mt-2"
              required
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          {/* Description */}
          <div className="flex w-full flex-col">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder=""
              type="text"
              autoCorrect="off"
              disabled={updatePartMutation.isPending}
              {...register("description")}
              className="mt-2"
            />
            {errors?.description && (
              <p className="px-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
          {/* Cost Price */}
          <div className="flex w-full flex-col">
            <Label htmlFor="costPrice" required>
              Cost Price
            </Label>
            <Input
              id="costPrice"
              placeholder=""
              type="number"
              step="0.01"
              min="0"
              autoCorrect="off"
              disabled={updatePartMutation.isPending}
              {...register("costPrice", { valueAsNumber: true })}
              className="mt-2"
              required
            />
            {errors?.costPrice && (
              <p className="px-1 text-xs text-red-600">
                {errors.costPrice.message}
              </p>
            )}
          </div>
          {/* Sell Price */}
          <div className="flex w-full flex-col">
            <Label htmlFor="sellPrice" required>
              Sell Price
            </Label>
            <Input
              id="sellPrice"
              placeholder=""
              type="number"
              step="0.01"
              min="0"
              autoCorrect="off"
              disabled={updatePartMutation.isPending}
              {...register("sellPrice", { valueAsNumber: true })}
              className="mt-2"
              required
            />
            {errors?.sellPrice && (
              <p className="px-1 text-xs text-red-600">
                {errors.sellPrice.message}
              </p>
            )}
          </div>
          {/* Profit */}
          <div className="flex w-full flex-col">
            <Label htmlFor="profit">Profit (auto-calculated)</Label>
            <Input
              id="profit"
              placeholder=""
              type="number"
              step="0.01"
              min="0"
              autoCorrect="off"
              disabled={true}
              {...register("profit", { valueAsNumber: true })}
              className="bg-muted mt-2"
            />
          </div>
          {/* Available Quantity */}
          <div className="flex w-full flex-col">
            <Label htmlFor="availableQuantity" required>
              Available Quantity
            </Label>
            <Input
              id="availableQuantity"
              placeholder=""
              type="number"
              min="0"
              autoCorrect="off"
              disabled={updatePartMutation.isPending}
              {...register("availableQuantity", { valueAsNumber: true })}
              className="mt-2"
              required
            />
            {errors?.availableQuantity && (
              <p className="px-1 text-xs text-red-600">
                {errors.availableQuantity.message}
              </p>
            )}
          </div>
        </div>
        {/* Footer */}
        <DialogFooter>
          <Button
            type="submit"
            disabled={updatePartMutation.isPending}
            onClick={handleSubmit((data: FormData) =>
              updatePartMutation.mutate(data),
            )}
          >
            {updatePartMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
