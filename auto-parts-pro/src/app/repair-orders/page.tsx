import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function RepairOrdersPage() {
  return (
    <div className="w-full p-4">
      {/* Header */}
      <Header>
        <div className="flex items-center justify-between">
          <span>Repair Orders</span>
          <Link href="/repair-orders/create">
            <Button>
              Add repair order <Plus className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Header>
      {/* Content */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4"></div>
    </div>
  );
}
