"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import dayjs from "@/lib/dayjs";
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
import type { Part } from "@prisma/client";
import { api } from "@/trpc/react";

import { DeletePartDialog } from "./DeletePartDialog";
import { EditPartDialog } from "./EditPartDialog";

export function DataTable() {
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get parts
  const { data: parts, isLoading } = api.parts.list.useQuery();

  // Table columns
  const columns: ColumnDef<Part>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return <span>{row.getValue("name")}</span>;
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          return <span>{row.getValue("description") ?? "-"}</span>;
        },
      },
      {
        accessorKey: "costPrice",
        header: "Cost Price",
        cell: ({ row }) => {
          return <span>${row.getValue("costPrice")}</span>;
        },
      },
      {
        accessorKey: "sellPrice",
        header: "Sell Price",
        cell: ({ row }) => {
          return <span>${row.getValue("sellPrice")}</span>;
        },
      },
      {
        accessorKey: "profit",
        header: "Profit",
        cell: ({ row }) => {
          return <span>${row.getValue("profit")}</span>;
        },
      },
      {
        accessorKey: "availableQuantity",
        header: "Available Quantity",
        cell: ({ row }) => {
          return <span>{row.getValue("availableQuantity")}</span>;
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
          const editPart = async (event: any) => {
            event.stopPropagation();
            setSelectedPart(row.original);
            setShowEditDialog(true);
          };

          const deletePart = async (event: any) => {
            event.stopPropagation();
            setSelectedPart(row.original);
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
                <DropdownMenuItem onClick={editPart} className="cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deletePart}
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
    () => (isLoading ? Array(5).fill({}) : (parts ?? [])),
    [isLoading, parts],
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
      <EditPartDialog
        key={`${selectedPart?.id}-edit`}
        isOpen={showEditDialog}
        setIsOpen={setShowEditDialog}
        part={selectedPart}
      />
      <DeletePartDialog
        key={`${selectedPart?.id}-delete`}
        isOpen={showDeleteDialog}
        setIsOpen={setShowDeleteDialog}
        part={selectedPart}
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
                  No parts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="my-4 flex w-full justify-between">
        {/* Pagination controls can be added here if needed */}
      </div>
    </>
  );
}
