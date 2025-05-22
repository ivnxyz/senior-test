import { Header } from "@/components/ui/header";

import { NewVehicleDialog } from "./components/NewVehicleDialog";
import { DataTable } from "./components/DataTable";

export default function VehiclesPage() {
  return (
    <div className="w-full p-4">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <span>Vehicles</span>
          <NewVehicleDialog />
        </div>
      </Header>
      {/* Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <DataTable />
      </div>
    </div>
  );
}
