"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/ui/header";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { repairOrderSchema } from "@/lib/validations/repair-order";
import type { z } from "zod";
import type { Priority } from "@prisma/client";

type FormData = z.infer<typeof repairOrderSchema>;

export default function CreateRepairOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch parts for order details
  const { data: parts, isLoading: isLoadingParts } = api.parts.list.useQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(repairOrderSchema),
    defaultValues: {
      costPrice: 0,
      sellPrice: 0,
      profit: 0,
      priority: "MEDIUM",
      orderDetails: [],
      labors: [],
    },
  });

  const selectedCustomerId = watch("customerId");
  const selectedVehicleId = watch("vehicleId");

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } =
    api.customers.list.useQuery();

  // Fetch vehicles based on selected customer
  const { data: vehicles, isLoading: isLoadingVehicles } =
    api.vehicles.list.useQuery(
      { customerId: selectedCustomerId ?? 0 },
      { enabled: !!selectedCustomerId },
    );

  // State for parts and labor items
  const [orderDetails, setOrderDetails] = useState<
    Array<{
      partId: number;
      partName: string;
      quantity: number;
      costPrice: number;
      sellPrice: number;
      profit: number;
    }>
  >([]);

  const [labors, setLabors] = useState<
    Array<{
      name: string;
      description?: string;
      hours: number;
      rate: number;
      total: number;
    }>
  >([]);

  // For adding new part to order
  const [newPart, setNewPart] = useState({
    partId: 0,
    quantity: 1,
  });

  // For adding new labor to order
  const [newLabor, setNewLabor] = useState({
    name: "",
    description: "",
    hours: 0,
    rate: 0,
  });

  // Create repair order mutation
  const createRepairOrder = api.repairOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Repair order created successfully");
      router.push("/repair-orders");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to create repair order: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const addPart = () => {
    if (newPart.partId <= 0 || newPart.quantity <= 0) {
      toast.error("Please select a part and specify a valid quantity");
      return;
    }

    const selectedPart = parts?.find(
      (p: { id: number }) => p.id === newPart.partId,
    );
    if (!selectedPart) {
      toast.error("Selected part not found");
      return;
    }

    const costPrice = selectedPart.costPrice * newPart.quantity;
    const sellPrice = selectedPart.sellPrice * newPart.quantity;

    const newOrderDetail = {
      partId: newPart.partId,
      partName: selectedPart.name,
      quantity: newPart.quantity,
      costPrice,
      sellPrice,
      profit: sellPrice - costPrice,
    };

    setOrderDetails([...orderDetails, newOrderDetail]);
    setNewPart({ partId: 0, quantity: 1 });
    updateTotals([...orderDetails, newOrderDetail], labors);
  };

  const addLabor = () => {
    if (!newLabor.name || newLabor.hours <= 0 || newLabor.rate <= 0) {
      toast.error("Please provide a name, hours and rate for the labor");
      return;
    }

    const total = newLabor.hours * newLabor.rate;

    const newLaborItem = {
      ...newLabor,
      total,
    };

    setLabors([...labors, newLaborItem]);
    setNewLabor({ name: "", description: "", hours: 0, rate: 0 });
    updateTotals(orderDetails, [...labors, newLaborItem]);
  };

  const removePart = (index: number) => {
    const updatedOrderDetails = [...orderDetails];
    updatedOrderDetails.splice(index, 1);
    setOrderDetails(updatedOrderDetails);
    updateTotals(updatedOrderDetails, labors);
  };

  const removeLabor = (index: number) => {
    const updatedLabors = [...labors];
    updatedLabors.splice(index, 1);
    setLabors(updatedLabors);
    updateTotals(orderDetails, updatedLabors);
  };

  const updateTotals = (
    details: typeof orderDetails,
    laborItems: typeof labors,
  ) => {
    const partsCost = details.reduce((sum, item) => sum + item.costPrice, 0);
    const partsSell = details.reduce((sum, item) => sum + item.sellPrice, 0);
    const laborCost = laborItems.reduce((sum, item) => sum + item.total, 0); // Assuming labor cost = labor sell price for simplicity

    const totalCost = partsCost;
    const totalSell = partsSell + laborCost;
    const totalProfit = totalSell - totalCost;

    setValue("costPrice", totalCost);
    setValue("sellPrice", totalSell);
    setValue("profit", totalProfit);
  };

  const onSubmit = (data: FormData) => {
    if (!selectedCustomerId || !selectedVehicleId) {
      toast.error("Please select a customer and vehicle");
      return;
    }

    if (orderDetails.length === 0 && labors.length === 0) {
      toast.error("Please add at least one part or labor item");
      return;
    }

    setIsSubmitting(true);

    // Prepare data for submission
    const formattedOrderDetails = orderDetails.map((detail) => ({
      partId: detail.partId,
      quantity: detail.quantity,
      costPrice: detail.costPrice,
      sellPrice: detail.sellPrice,
      profit: detail.profit,
    }));

    const formattedLabors = labors.map((labor) => ({
      name: labor.name,
      description: labor.description,
      hours: labor.hours,
      rate: labor.rate,
      total: labor.total,
    }));

    const repairOrderData = {
      ...data,
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId,
      orderDetails: formattedOrderDetails,
      labors: formattedLabors,
    };

    createRepairOrder.mutate(repairOrderData);
  };

  return (
    <div className="w-full p-4">
      <Header>
        <div className="flex items-center justify-between">
          <span>Create Repair Order</span>
        </div>
      </Header>

      <div className="mx-auto mt-6 w-full max-w-6xl space-y-6">
        {/* Customer and Vehicle Selection */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">
            Customer & Vehicle Information
          </h2>
          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <Select
                disabled={isLoadingCustomers}
                value={selectedCustomerId?.toString() ?? ""}
                onValueChange={(value) =>
                  setValue("customerId", Number(value), {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: { id: number; name: string }) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-destructive text-xs">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle</label>
              <Select
                disabled={!selectedCustomerId || isLoadingVehicles}
                value={selectedVehicleId?.toString() ?? ""}
                onValueChange={(value) =>
                  setValue("vehicleId", Number(value), {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map(
                    (vehicle: {
                      id: number;
                      year: number;
                      make: { name: string };
                      model: string;
                      licensePlate: string;
                    }) => (
                      <SelectItem
                        key={vehicle.id}
                        value={vehicle.id.toString()}
                      >
                        {vehicle.year} {vehicle.make.name} {vehicle.model} (
                        {vehicle.licensePlate})
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-destructive text-xs">
                  {errors.vehicleId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              rows={3}
              placeholder="Describe the repair order..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={watch("priority")}
              onValueChange={(value) =>
                setValue("priority", value as Priority, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Parts Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Parts</h2>
          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Part</label>
              <Select
                disabled={isLoadingParts}
                value={newPart.partId.toString()}
                onValueChange={(value) =>
                  setNewPart({ ...newPart, partId: Number(value) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a part" />
                </SelectTrigger>
                <SelectContent>
                  {parts?.map(
                    (part: { id: number; name: string; sellPrice: number }) => (
                      <SelectItem key={part.id} value={part.id.toString()}>
                        {part.name} (${part.sellPrice.toFixed(2)})
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min={1}
                value={newPart.quantity}
                onChange={(e) =>
                  setNewPart({ ...newPart, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex items-end">
              <Button onClick={addPart} className="w-full">
                Add Part
              </Button>
            </div>
          </div>

          {/* Parts List */}
          {orderDetails.length > 0 && (
            <div className="mt-4 rounded-md border">
              <div className="grid grid-cols-5 gap-2 border-b p-2 font-medium">
                <div>Part</div>
                <div>Quantity</div>
                <div>Cost</div>
                <div>Price</div>
                <div>Actions</div>
              </div>
              {orderDetails.map((detail, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 gap-2 border-b p-2"
                >
                  <div>{detail.partName}</div>
                  <div>{detail.quantity}</div>
                  <div>${detail.costPrice.toFixed(2)}</div>
                  <div>${detail.sellPrice.toFixed(2)}</div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePart(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labor Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Labor</h2>
          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newLabor.name}
                onChange={(e) =>
                  setNewLabor({ ...newLabor, name: e.target.value })
                }
                placeholder="Labor name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newLabor.description}
                onChange={(e) =>
                  setNewLabor({ ...newLabor, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hours</label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={newLabor.hours}
                onChange={(e) =>
                  setNewLabor({ ...newLabor, hours: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rate</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={newLabor.rate}
                onChange={(e) =>
                  setNewLabor({ ...newLabor, rate: Number(e.target.value) })
                }
                placeholder="Hourly rate"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={addLabor}>Add Labor</Button>
          </div>

          {/* Labor List */}
          {labors.length > 0 && (
            <div className="mt-4 rounded-md border">
              <div className="grid grid-cols-5 gap-2 border-b p-2 font-medium">
                <div>Name</div>
                <div>Description</div>
                <div>Hours</div>
                <div>Total</div>
                <div>Actions</div>
              </div>
              {labors.map((labor, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 gap-2 border-b p-2"
                >
                  <div>{labor.name}</div>
                  <div>{labor.description ?? "N/A"}</div>
                  <div>
                    {labor.hours} hrs @ ${labor.rate}/hr
                  </div>
                  <div>${labor.total.toFixed(2)}</div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLabor(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Cost:</span>
              <span>${watch("costPrice").toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Sell Price:</span>
              <span>${watch("sellPrice").toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Profit:</span>
              <span>${watch("profit").toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/repair-orders")}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit(onSubmit)()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Repair Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
