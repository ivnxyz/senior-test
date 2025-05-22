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
import type { Vehicle } from "@prisma/client";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

interface DeleteVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  vehicle?: Vehicle | null;
}

export function DeleteVehicleDialog({
  isOpen,
  setIsOpen,
  vehicle,
}: DeleteVehicleDialogProps) {
  if (!vehicle) {
    return <></>;
  }

  const deleteVehicleMutation = api.vehicles.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");

      // Reload page
      window.location.reload();
    },
    onError: () => {
      toast.error("An error occurred while deleting vehicle");
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting &quot;{vehicle.model}&quot; cannot be undone
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
            disabled={deleteVehicleMutation.isPending}
            className="bg-destructive text-white hover:bg-red-600"
          >
            {deleteVehicleMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
