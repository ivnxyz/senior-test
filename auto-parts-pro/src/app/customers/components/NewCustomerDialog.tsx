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

type FormData = z.infer<typeof customerSchema>;

interface NewCustomerDialogProps {
  secondary?: boolean;
  trigger?: React.ReactNode;
}

export const NewCustomerDialog = ({
  secondary = false,
  trigger,
}: NewCustomerDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(customerSchema),
  });

  // Create customer mutation
  const createCustomerMutation = api.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      window.location.reload();
    },
    onError: () => {
      toast.error("An error ocurred while creating the customer");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={secondary ? "outline" : "default"}>
            Add customer <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
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
              disabled={createCustomerMutation.isPending}
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
              disabled={createCustomerMutation.isPending}
              {...register("phoneNumber")}
              className="mt-2"
            />
            {errors?.phoneNumber && (
              <p className="px-1 text-xs text-red-600">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          {/* Email */}
          <div className="flex w-full flex-col">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder=""
              type="email"
              autoCorrect="off"
              disabled={createCustomerMutation.isPending}
              {...register("email")}
              className="mt-2"
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
        {/* Footer */}
        <DialogFooter>
          <Button
            type="submit"
            disabled={createCustomerMutation.isPending}
            onClick={handleSubmit((data: FormData) =>
              createCustomerMutation.mutate(data),
            )}
          >
            {createCustomerMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
