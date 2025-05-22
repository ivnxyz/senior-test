"use client";

import { useCallback, useState } from "react";
import { ChevronsUpDownIcon, CheckIcon, Loader2 } from "lucide-react";
import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NewCustomerDialog } from "@/app/customers/components/NewCustomerDialog";
import { api } from "@/trpc/react";
import { type Customer } from "@prisma/client";

interface CustomerSelectorProps {
  showLabel?: boolean | null;
  selectedCustomer?: number | null;
  setSelectedCustomer?: (customerId: number) => void;
  hideAddNew?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CustomerSelector({
  showLabel,
  selectedCustomer,
  setSelectedCustomer,
  hideAddNew,
  disabled,
  placeholder = "Select a customer",
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: customers, refetch, isLoading } = api.customers.list.useQuery();

  const onCustomerFoundOrCreated = useCallback(
    async (customer: Customer) => {
      // Add the new customer to the list (if it's not already there)
      await refetch();

      // Select the new customer
      setSelectedCustomer?.(customer.id);
    },
    [refetch, setSelectedCustomer],
  );

  return (
    <div>
      {/* Label */}
      {showLabel && (
        <Label className="block text-sm font-medium text-gray-700">
          Customer
        </Label>
      )}
      {/* Content */}
      <div className="flex gap-2">
        {/* Select */}
        <Popover open={open} onOpenChange={setOpen}>
          {/* Trigger */}
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between px-3 py-2 text-sm font-normal"
              disabled={disabled ?? isLoading}
            >
              {selectedCustomer
                ? customers?.find(
                    (customer) => customer.id === selectedCustomer,
                  )?.name
                : placeholder}
              {isLoading && (
                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              )}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          {/* Content */}
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search customer..." className="h-9" />
              <CommandEmpty>No customer found</CommandEmpty>
              <CommandGroup>
                {customers?.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.name}-${customer.phoneNumber}`}
                    onSelect={() => {
                      setSelectedCustomer?.(customer.id);
                      setOpen(false);
                    }}
                  >
                    {customer.name}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCustomer === customer.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {/* New customer */}
        {!hideAddNew && (
          <NewCustomerDialog
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={disabled ?? isLoading}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            }
            onCustomerCreated={onCustomerFoundOrCreated}
          />
        )}
      </div>
    </div>
  );
}
