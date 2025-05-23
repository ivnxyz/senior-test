import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { getStatusBadgeClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/dayjs";
import type { Customer, Make, RepairOrder, Vehicle } from "@prisma/client";
import { Calendar, User, Car, ArrowRight, PencilIcon } from "lucide-react";

interface RepairOrderCardProps {
  order: RepairOrder & {
    vehicle: Vehicle & {
      make: Make;
    };
    customer: Customer;
  };
  handleUpdateStatus?: (orderId: number, currentStatus: string) => void | null;
}

export const RepairOrderCard = ({
  order,
  handleUpdateStatus,
}: RepairOrderCardProps) => {
  return (
    <Link key={order.id} href={`/repair-orders/${order.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                #{order.id} - {order.vehicle.make.name} {order.vehicle.model}
              </CardTitle>
              <CardDescription className="mt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {dayjs(order.createdAt).format("LL")}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpdateStatus?.(order.id, order.status);
                }}
                className={getStatusBadgeClass(order.status)}
              >
                {order.status.replace("_", " ")}
                <PencilIcon className="h-2 w-2" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <span className="text-muted-foreground text-sm">
            {order.description}
          </span>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <span>{order.customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="text-muted-foreground h-4 w-4" />
              <span>
                {order.vehicle.make.name} {order.vehicle.model} (
                {order.vehicle.year})
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            <span className="font-medium">${order.sellPrice.toFixed(2)}</span>
          </div>
          <Button variant="ghost" size="sm">
            View details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
