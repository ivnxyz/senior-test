"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type * as z from "zod";

import { partSchema } from "@/lib/validations/parts";
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
import type { Part } from "@prisma/client";

type FormData = z.infer<typeof partSchema>;

interface NewPartDialogProps {
  secondary?: boolean;
  trigger?: React.ReactNode;
  onPartCreated?: (part: Part) => void;
}

export const NewPartDialog = ({
  secondary = false,
  trigger,
  onPartCreated,
}: NewPartDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      profit: 0,
    },
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

  // Create part mutation
  const createPartMutation = api.parts.create.useMutation({
    onSuccess: (createdPart: Part) => {
      // Show toast
      toast.success("Part created successfully");
      setIsOpen(false);

      // Callback
      if (onPartCreated) {
        onPartCreated(createdPart);
      } else {
        window.location.reload();
      }
    },
    onError: () => {
      toast.error("An error occurred while creating the part");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={secondary ? "outline" : "default"}>
            Add part <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>New part</DialogTitle>
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
              disabled={createPartMutation.isPending}
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
              disabled={createPartMutation.isPending}
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
              disabled={createPartMutation.isPending}
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
              disabled={createPartMutation.isPending}
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
              disabled={createPartMutation.isPending}
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
            disabled={createPartMutation.isPending}
            onClick={handleSubmit((data: FormData) =>
              createPartMutation.mutate(data),
            )}
          >
            {createPartMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
