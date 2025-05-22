"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Car,
  ClipboardList,
  DollarSign,
  HardHat,
  Package,
  Tag,
  User,
} from "lucide-react";
import dayjs from "@/lib/dayjs";

export default function RepairOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: repairOrderData, isLoading } = api.repairOrders.find.useQuery({
    id,
  });

  // Since the find endpoint returns an array, get the first item
  const repairOrder = repairOrderData?.[0];

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <RepairOrderDetailSkeleton />;
  }

  if (!repairOrder) {
    return (
      <div className="w-full p-4">
        <Header>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="ml-2">Repair Order Not Found</span>
          </div>
        </Header>
        <div className="mx-auto mt-8 max-w-4xl text-center">
          <h2 className="text-2xl font-bold">Repair Order Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The repair order you are looking for does not exist or has been
            removed.
          </p>
          <Button className="mt-4" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 hover:bg-green-500/90";
      case "IN_PROGRESS":
        return "bg-yellow-500 hover:bg-yellow-500/90";
      case "PENDING":
        return "bg-blue-500 hover:bg-blue-500/90";
      case "CANCELLED":
        return "bg-red-500 hover:bg-red-500/90";
      default:
        return "";
    }
  };

  return (
    <div className="w-full p-4">
      <Header>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="ml-2">
            Repair Order #{repairOrder.id} - {repairOrder.vehicle.make.name}{" "}
            {repairOrder.vehicle.model}
          </span>
        </div>
      </Header>

      <div className="mx-auto mt-6 max-w-4xl">
        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Repair Order #{repairOrder.id}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {dayjs(repairOrder.createdAt).format("LL")}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeClass(repairOrder.status)}>
                {repairOrder.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Customer
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {repairOrder.customer.name}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {repairOrder.customer.email && (
                    <p>Email: {repairOrder.customer.email}</p>
                  )}
                  {repairOrder.customer.phoneNumber && (
                    <p>Phone: {repairOrder.customer.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Vehicle
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">
                    {repairOrder.vehicle.make.name} {repairOrder.vehicle.model}{" "}
                    ({repairOrder.vehicle.year})
                  </span>
                </div>
                {/* Vehicle information */}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-muted-foreground text-sm font-medium">
                Description
              </h3>
              <p className="mt-1">
                {repairOrder.description ?? "No description provided"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col rounded-md border p-3">
                <span className="text-muted-foreground text-sm">Priority</span>
                <div className="mt-1 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">{repairOrder.priority}</span>
                </div>
              </div>

              <div className="flex flex-col rounded-md border p-3">
                <span className="text-muted-foreground text-sm">Markup</span>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">{repairOrder.markUp}</span>
                </div>
              </div>

              <div className="flex flex-col rounded-md border p-3">
                <span className="text-muted-foreground text-sm">Profit</span>
                <div className="mt-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">
                    {formatCurrency(repairOrder.profit)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5" />
              Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repairOrder.orderDetails.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No parts added to this repair order
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground px-4 py-2 text-left text-sm font-medium">
                        Part
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Quantity
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Cost
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Sell Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairOrder.orderDetails.map((detail) => (
                      <tr key={detail.id} className="border-b">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{detail.part.name}</p>
                            {/* Additional part details would go here */}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {detail.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(detail.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(detail.sellPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labor Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HardHat className="h-5 w-5" />
              Labor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repairOrder.labors.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No labor added to this repair order
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground px-4 py-2 text-left text-sm font-medium">
                        Service
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Hours
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Rate
                      </th>
                      <th className="text-muted-foreground px-4 py-2 text-right text-sm font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairOrder.labors.map((labor) => (
                      <tr key={labor.id} className="border-b">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{labor.name}</p>
                            {labor.description && (
                              <p className="text-muted-foreground text-sm">
                                {labor.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{labor.hours}</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(labor.rate)}/hr
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(labor.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Subtotal</span>
                <span>
                  {formatCurrency(
                    repairOrder.orderDetails.reduce(
                      (sum, detail) => sum + detail.costPrice,
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor Subtotal</span>
                <span>
                  {formatCurrency(
                    repairOrder.labors.reduce(
                      (sum, labor) => sum + labor.total,
                      0,
                    ),
                  )}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Cost</span>
                <span>{formatCurrency(repairOrder.costPrice)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Sell Price</span>
                <span>{formatCurrency(repairOrder.sellPrice)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Profit</span>
                <span>{formatCurrency(repairOrder.profit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RepairOrderDetailSkeleton() {
  return (
    <div className="w-full p-4">
      <Header>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="ml-2 h-6 w-64" />
        </div>
      </Header>

      <div className="mx-auto mt-6 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-48" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-48" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
            </div>
            <Skeleton className="mt-4 h-4 w-24" />
            <Skeleton className="mt-2 h-20 w-full" />

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-1 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-40" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
