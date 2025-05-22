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
import { NewMakeDialog } from "@/app/makes/components/NewMakeDialog";
import { api } from "@/trpc/react";
import { type Make } from "@prisma/client";

interface MakeSelectorProps {
  showLabel?: boolean | null;
  selectedMake?: number | null;
  setSelectedMake?: (makeId: number) => void;
  hideAddNew?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MakeSelector({
  showLabel,
  selectedMake,
  setSelectedMake,
  hideAddNew,
  disabled,
  placeholder = "Select a make",
}: MakeSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: makes, refetch, isLoading } = api.makes.list.useQuery();

  const onMakeFoundOrCreated = useCallback(
    async (make: Make) => {
      // Add the new make to the list (if it's not already there)
      await refetch();

      // Select the new make
      setSelectedMake?.(make.id);
    },
    [refetch, setSelectedMake],
  );

  return (
    <div>
      {/* Label */}
      {showLabel && (
        <Label className="block text-sm font-medium text-gray-700">Make</Label>
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
              {selectedMake
                ? makes?.find((make) => make.id === selectedMake)?.name
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
              <CommandInput placeholder="Search make..." className="h-9" />
              <CommandEmpty>No make found</CommandEmpty>
              <CommandGroup>
                {makes?.map((make) => (
                  <CommandItem
                    key={make.id}
                    value={make.name}
                    onSelect={() => {
                      setSelectedMake?.(make.id);
                      setOpen(false);
                    }}
                  >
                    {make.name}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedMake === make.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {/* New make */}
        {!hideAddNew && (
          <NewMakeDialog
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
            onMakeCreated={onMakeFoundOrCreated}
          />
        )}
      </div>
    </div>
  );
}
