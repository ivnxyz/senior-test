import { Header } from "@/components/ui/header";

import { DataTable } from "./components/DataTable";
import { NewCustomerDialog } from "./components/NewCustomerDialog";

export default function CustomersPage() {
  return (
    <div className="w-full p-4">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <span>Customers</span>
          <NewCustomerDialog />
        </div>
      </Header>
      {/* Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <DataTable />
      </div>
    </div>
  );
}
