import { Header } from "@/components/ui/header";
// import { NewPartDialog } from "./components/NewPartDialog";
// import { DataTable } from "./components/DataTable";

export default function RepairOrdersPage() {
  return (
    <div className="w-full p-4">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <span>Repair Orders</span>
          {/* <NewPartDialog /> */}
        </div>
      </Header>
      {/* Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {/* <DataTable /> */}
      </div>
    </div>
  );
}
