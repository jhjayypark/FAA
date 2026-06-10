"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import type { FNSLocation } from "@/lib/types";
import { useAllLocations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddLocationDialog } from "@/components/incidents/add-location-dialog";

/**
 * Multi-select for FNS locations: searchable dropdown (Popover + Command),
 * removable chips for the current selection, and a fixed "Add location" row
 * that opens a mini dialog for custom locations.
 */
export function LocationMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const allLocations = useAllLocations();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const selectedLocations = value
    .map((id) => allLocations.find((l) => l.id === id))
    .filter((l): l is FNSLocation => Boolean(l));

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  function handleAdded(location: FNSLocation) {
    if (!value.includes(location.id)) {
      onChange([...value, location.id]);
    }
  }

  return (
    <div className="grid gap-2">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full justify-between font-normal"
          >
            <span className={value.length === 0 ? "text-muted-foreground" : undefined}>
              {value.length === 0
                ? "Select locations"
                : `${value.length} location${value.length === 1 ? "" : "s"} selected`}
            </span>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              size={14}
              strokeWidth={1.8}
              className="text-muted-foreground"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search by name, city, or state" />
            <CommandList>
              <CommandEmpty>No locations found.</CommandEmpty>
              {allLocations.map((loc) => {
                const selected = value.includes(loc.id);
                return (
                  <CommandItem
                    key={loc.id}
                    value={`${loc.name} ${loc.city} ${loc.state} ${loc.id}`}
                    data-checked={selected}
                    onSelect={() => toggle(loc.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{loc.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {loc.address || `${loc.city}${loc.city && loc.state ? ", " : ""}${loc.state}`}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  setAddOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.8} />
                Add location
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLocations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 py-0.5 pr-1 pl-2 text-xs text-foreground"
            >
              <span className="max-w-56 truncate">{loc.name}</span>
              <button
                type="button"
                aria-label={`Remove ${loc.name}`}
                onClick={() => remove(loc.id)}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={1.8} />
              </button>
            </span>
          ))}
        </div>
      )}

      <AddLocationDialog open={addOpen} onOpenChange={setAddOpen} onAdded={handleAdded} />
    </div>
  );
}
