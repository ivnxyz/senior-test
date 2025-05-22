import { useState } from "react";
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
import { toast } from "sonner";
import type { Customer } from "@prisma/client";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  customer?: Customer | null;
}

export function DeleteCustomerDialog({
  isOpen,
  setIsOpen,
  customer,
}: DeleteCustomerDialogProps) {
  if (!customer) {
    return <></>;
  }

  const deleteCustomerMutation = api.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted successfully");

      // Reload page
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while deleting customer");
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting &quot;{customer.name}&quot; cannot be undone
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteCustomerMutation.mutate(customer.id)}
            disabled={deleteCustomerMutation.isPending}
            className="bg-destructive text-white hover:bg-red-600"
          >
            {deleteCustomerMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
