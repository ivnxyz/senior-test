"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import type * as z from "zod";

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
import { newMakeSchema } from "@/lib/validations/makes";
import type { Make } from "@prisma/client";

type FormData = z.infer<typeof newMakeSchema>;

interface NewMakeDialogProps {
  secondary?: boolean;
  trigger?: React.ReactNode;
  onMakeCreated?: (make: Make) => void;
}

export const NewMakeDialog = ({
  secondary = false,
  trigger,
  onMakeCreated,
}: NewMakeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(newMakeSchema),
  });

  // Create make mutation
  const createMakeMutation = api.makes.create.useMutation({
    onSuccess: (createdMake) => {
      // Show toast
      toast.success("Make created successfully");
      setIsOpen(false);

      // Callback
      if (onMakeCreated) {
        onMakeCreated(createdMake);
      } else {
        window.location.reload();
      }
    },
    onError: () => {
      toast.error("An error ocurred while creating the make");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={secondary ? "outline" : "default"}>
            Add make <Plus className="ml-2 h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>New make</DialogTitle>
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
              disabled={createMakeMutation.isPending}
              {...register("name")}
              className="mt-2"
              required
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>
        {/* Footer */}
        <DialogFooter>
          <Button
            type="submit"
            disabled={createMakeMutation.isPending}
            onClick={handleSubmit((data: FormData) =>
              createMakeMutation.mutate(data),
            )}
          >
            {createMakeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add make
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
