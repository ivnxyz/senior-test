"use client";

import { useMemo, useState } from "react";
// import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import dayjs from "@/lib/dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer, Make, Vehicle } from "@prisma/client";
import { api } from "@/trpc/react";

import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import { EditVehicleDialog } from "./EditVehicleDialog";

export function DataTable() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get customers
  const { data: vehicles, isLoading } = api.vehicles.list.useQuery();

  // Table columns
  const columns: ColumnDef<Vehicle & { make: Make; customer: Customer }>[] =
    useMemo(
      () => [
        {
          accessorKey: "id",
          header: "Vehicle",
          cell: ({ row }) => {
            return <span>{row.original.model}</span>;
          },
        },
        {
          accessorKey: "year",
          header: "Year",
          cell: ({ row }) => {
            return <span>{row.getValue("year")}</span>;
          },
        },
        {
          accessorKey: "licensePlate",
          header: "License plate",
          cell: ({ row }) => {
            return <span>{row.getValue("licensePlate")}</span>;
          },
        },
        {
          accessorKey: "make",
          header: "Make",
          cell: ({ row }) => {
            const make = row.original.make;
            return <span>{make.name}</span>;
          },
        },
        {
          accessorKey: "customer",
          header: "Customer",
          cell: ({ row }) => {
            const customer = row.original.customer;
            return <span>{customer.name}</span>;
          },
        },
        {
          accessorKey: "createdAt",
          header: "Added",
          cell: ({ row }) => {
            return <span>{dayjs(row.getValue("createdAt")).format("LL")}</span>;
          },
        },
        {
          id: "actions",
          cell: ({ row }) => {
            const editVehicle = async (event: any) => {
              event.stopPropagation();
              setSelectedVehicle(row.original);
              setShowEditDialog(true);
            };

            const deleteVehicle = async (event: any) => {
              event.stopPropagation();
              setSelectedVehicle(row.original);
              setShowDeleteDialog(true);
            };

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={editVehicle}
                    className="cursor-pointer"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deleteVehicle}
                    className="text-destructive hover:text-destructive cursor-pointer"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ],
      [],
    );

  const columnsMemo = useMemo(
    () =>
      isLoading
        ? columns.map((column) => ({
            ...column,
            cell: () => <Skeleton className="h-4 w-full" />,
          }))
        : columns,
    [columns, isLoading],
  );

  const tableData = useMemo(
    () => (isLoading ? Array(5).fill({}) : (vehicles ?? [])),
    [isLoading, vehicles],
  );

  // Create table
  const table = useReactTable({
    data: tableData,
    columns: columnsMemo as any,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Dialog */}
      <EditVehicleDialog
        key={`${selectedVehicle?.id}-edit`}
        isOpen={showEditDialog}
        setIsOpen={setShowEditDialog}
        vehicle={selectedVehicle}
      />
      <DeleteVehicleDialog
        key={`${selectedVehicle?.id}-delete`}
        isOpen={showDeleteDialog}
        setIsOpen={setShowDeleteDialog}
        vehicle={selectedVehicle}
      />
      <div className="relative w-full overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="my-4 flex w-full justify-between">
        {/* Previous page */}
        <div>
          {/* <Button
            disabled={!pagination.hasPreviousPage || status === "loading"}
            variant="outline"
            size="icon"
            onClick={loadPreviousPage}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button> */}
        </div>
        {/* Next page */}
        <div>
          {/* <Button
            disabled={!pagination.hasNextPage || status === "loading"}
            variant="outline"
            size="icon"
            onClick={loadNextPage}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button> */}
        </div>
      </div>
    </>
  );
}
