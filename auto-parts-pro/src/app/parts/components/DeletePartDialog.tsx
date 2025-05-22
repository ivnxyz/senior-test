"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Part } from "@prisma/client";

interface DeletePartDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  part: Part | null;
}

export function DeletePartDialog({
  isOpen,
  setIsOpen,
  part,
}: DeletePartDialogProps) {
  const [isPending, setIsPending] = useState(false);

  // Reset pending state when the dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setIsPending(false);
    }
  }, [isOpen]);

  // Mutation to delete part
  const deletePartMutation = api.parts.delete.useMutation({
    onSuccess: () => {
      toast.success("Part deleted successfully");
      setIsOpen(false);
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while deleting the part");
      setIsPending(false);
    },
  });

  // Handle delete
  const handleDelete = () => {
    if (!part) return;

    setIsPending(true);
    deletePartMutation.mutate(part.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete part</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this part? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
