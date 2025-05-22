"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { editCustomerSchema } from "@/lib/validations/customer";
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
import type { Customer } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

type FormData = z.infer<typeof editCustomerSchema>;

interface EditCustomerDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  customer?: Customer | null;
}

export const EditCustomerDialog = ({
  isOpen,
  setIsOpen,
  customer,
}: EditCustomerDialogProps) => {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      id: customer?.id,
      name: customer?.name,
      phoneNumber: customer?.phoneNumber,
    },
  });

  console.log("DEBUG errors=", errors);

  // Handle update
  const updateCustomerMutation = api.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated successfully");

      // Reload page
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while updating customer");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
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
              disabled={updateCustomerMutation.isPending}
              {...register("name")}
              className="mt-2"
              required
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          {/* Phone number */}
          <div className="flex w-full flex-col">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input
              id="phoneNumber"
              placeholder=""
              type="text"
              autoCorrect="off"
              disabled={updateCustomerMutation.isPending}
              {...register("phoneNumber")}
              className="mt-2"
            />
            {errors?.phoneNumber && (
              <p className="px-1 text-xs text-red-600">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
        </div>
        {/* Footer */}
        <DialogFooter>
          <Button
            type="submit"
            disabled={updateCustomerMutation.isPending}
            onClick={handleSubmit((data) =>
              updateCustomerMutation.mutate(data),
            )}
          >
            {updateCustomerMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
