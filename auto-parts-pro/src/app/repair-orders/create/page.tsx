"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormData = z.infer<typeof repairOrderSchema>;

export default function CreateRepairOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog open states
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [laborDialogOpen, setLaborDialogOpen] = useState(false);

  // Fetch parts for order details
  const { data: parts, isLoading: isLoadingParts } = api.parts.list.useQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(repairOrderSchema) as any,
    defaultValues: {
      costPrice: 0,
      sellPrice: 0,
      markUp: 0,
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

    // Check if there's enough stock available
    if (selectedPart.availableQuantity < newPart.quantity) {
      toast.error(
        `Not enough stock. Only ${selectedPart.availableQuantity} units available.`,
      );
      return;
    }

    // Check if part already exists in orderDetails
    const existingPartIndex = orderDetails.findIndex(
      (detail) => detail.partId === newPart.partId,
    );

    let updatedOrderDetails = [...orderDetails];

    if (existingPartIndex >= 0) {
      // Update existing part
      const existingPart = orderDetails[existingPartIndex];
      if (existingPart) {
        const newQuantity = existingPart.quantity + newPart.quantity;

        // Check if combined quantity exceeds available stock
        if (selectedPart.availableQuantity < newQuantity) {
          toast.error(
            `Not enough stock. Can't add ${newPart.quantity} more units. Only ${selectedPart.availableQuantity - existingPart.quantity} additional units available.`,
          );
          return;
        }

        const newCostPrice = selectedPart.costPrice * newQuantity;
        const newSellPrice = selectedPart.sellPrice * newQuantity;

        updatedOrderDetails[existingPartIndex] = {
          partId: existingPart.partId,
          partName: existingPart.partName,
          quantity: newQuantity,
          costPrice: newCostPrice,
          sellPrice: newSellPrice,
          profit: newSellPrice - newCostPrice,
        };

        toast.success("Part quantity updated");
      }
    } else {
      // Add new part
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

      updatedOrderDetails = [...updatedOrderDetails, newOrderDetail];
    }

    setOrderDetails(updatedOrderDetails);
    setNewPart({ partId: 0, quantity: 1 });
    updateTotals(updatedOrderDetails, labors);
    setPartDialogOpen(false);
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
    setLaborDialogOpen(false);
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
    const laborCost = laborItems.reduce((sum, item) => sum + item.total, 0);

    const totalCost = partsCost + laborCost;
    const markUp = watch("markUp") ?? 0;
    const totalSell = partsSell + laborCost + markUp;
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
      markUp: data.markUp ?? 0,
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
        <Card>
          <CardHeader>
            <CardTitle>Customer & Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    {customers?.map(
                      (customer: { id: number; name: string }) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                        </SelectItem>
                      ),
                    )}
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
          </CardContent>
        </Card>

        {/* Parts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Parts</CardTitle>
              <CardDescription>
                Add parts required for the repair
              </CardDescription>
            </div>
            <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1" variant="outline">
                  <PlusCircle className="h-4 w-4" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Part</DialogTitle>
                  <DialogDescription>
                    Select a part and specify the quantity needed
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Part</label>
                    <Select
                      disabled={isLoadingParts}
                      value={
                        newPart.partId ? newPart.partId?.toString() : undefined
                      }
                      onValueChange={(value) =>
                        setNewPart({ ...newPart, partId: Number(value) })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts?.map(
                          (part: {
                            id: number;
                            name: string;
                            sellPrice: number;
                            availableQuantity: number;
                          }) => (
                            <SelectItem
                              key={part.id}
                              value={part.id.toString()}
                            >
                              {part.name} (${part.sellPrice.toFixed(2)}) -{" "}
                              {part.availableQuantity} in stock
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
                        setNewPart({
                          ...newPart,
                          quantity: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPartDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addPart}>Add Part</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {orderDetails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDetails.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {detail.partName}
                      </TableCell>
                      <TableCell>{detail.quantity}</TableCell>
                      <TableCell>${detail.costPrice.toFixed(2)}</TableCell>
                      <TableCell>${detail.sellPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePart(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">
                  No parts added yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labor Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Labor</CardTitle>
              <CardDescription>
                Add labor required for the repair
              </CardDescription>
            </div>
            <Dialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1" variant="outline">
                  <PlusCircle className="h-4 w-4" />
                  Add Labor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Labor</DialogTitle>
                  <DialogDescription>
                    Enter labor details for the repair
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                    <label className="text-sm font-medium">
                      Description (Optional)
                    </label>
                    <Input
                      value={newLabor.description}
                      onChange={(e) =>
                        setNewLabor({
                          ...newLabor,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hours</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={newLabor.hours}
                        onChange={(e) =>
                          setNewLabor({
                            ...newLabor,
                            hours: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rate ($/hr)</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={newLabor.rate}
                        onChange={(e) =>
                          setNewLabor({
                            ...newLabor,
                            rate: Number(e.target.value),
                          })
                        }
                        placeholder="Hourly rate"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setLaborDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addLabor}>Add Labor</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {labors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours & Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labors.map((labor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {labor.name}
                      </TableCell>
                      <TableCell>{labor.description ?? "N/A"}</TableCell>
                      <TableCell>
                        {labor.hours} hrs @ ${labor.rate}/hr
                      </TableCell>
                      <TableCell>${labor.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLabor(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">
                  No labor items added yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span>${watch("costPrice").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sell Price:</span>
                <span>${watch("sellPrice").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mark Up:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-24"
                    value={watch("markUp")}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setValue("markUp", value);
                      updateTotals(orderDetails, labors);
                    }}
                  />
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Profit:</span>
                <span>${watch("profit").toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              onClick={() => void handleSubmit(onSubmit)()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Repair Order"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
