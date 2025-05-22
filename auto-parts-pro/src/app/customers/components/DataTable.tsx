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
import type { Customer } from "@prisma/client";
import { api } from "@/trpc/react";

import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";

export function DataTable() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get customers
  const { data: customers, isLoading } = api.customers.list.useQuery();

  // Table columns
  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => {
          const name: string = row.getValue("name");

          return (
            <div className="flex items-center gap-3 font-medium">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span>{name}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone number",
        cell: ({ row }) => {
          return <span>{row.getValue("phoneNumber")}</span>;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          return <span>{row.getValue("email")}</span>;
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
          const editCustomer = async (event: any) => {
            event.stopPropagation();
            setSelectedCustomer(row.original);
            setShowEditDialog(true);
          };

          const deleteCustomer = async (event: any) => {
            event.stopPropagation();
            setSelectedCustomer(row.original);
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
                  onClick={editCustomer}
                  className="cursor-pointer"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deleteCustomer}
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
    () => (isLoading ? Array(5).fill({}) : (customers ?? [])),
    [isLoading, customers],
  );

  // Create table
  const table = useReactTable({
    data: tableData,
    columns: columnsMemo as any,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handle previous page
  // const handlePreviousPage = () => {
  //   if (!pagination.hasPreviousPage) return

  //   const params = new URLSearchParams(searchParams)
  //   params.set("page", String(pagination.page - 1))
  //   router.replace(`${pathname}?${params.toString()}`)
  // }

  // // Handle next page
  // const handleNextPage = () => {
  //   if (!pagination.hasNextPage) return

  //   const params = new URLSearchParams(searchParams)
  //   params.set("page", String(pagination.page + 1))
  //   router.replace(`${pathname}?${params.toString()}`)
  // }

  return (
    <>
      {/* Dialog */}
      <EditCustomerDialog
        key={`${selectedCustomer?.id}-edit`}
        isOpen={showEditDialog}
        setIsOpen={setShowEditDialog}
        customer={selectedCustomer}
      />
      <DeleteCustomerDialog
        key={`${selectedCustomer?.id}-delete`}
        isOpen={showDeleteDialog}
        setIsOpen={setShowDeleteDialog}
        customer={selectedCustomer}
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
                  No customers found
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
