"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import type { FNSLocation } from "@/lib/types";
import { useAllLocations } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddLocationDialog } from "@/components/incidents/add-location-dialog";

/** Dropdown group per country, custom locations last. */
const GROUP_ORDER = ["us", "canada", "mexico", "panama", "custom"] as const;
type LocationGroup = (typeof GROUP_ORDER)[number];

const GROUP_LABEL_KEYS: Record<LocationGroup, string> = {
  us: "incidents.locations.group.us",
  canada: "incidents.locations.group.canada",
  mexico: "incidents.locations.group.mexico",
  panama: "incidents.locations.group.panama",
  custom: "incidents.locations.group.custom",
};

function groupOf(loc: FNSLocation): LocationGroup {
  if (loc.isCustom) return "custom";
  if (["ON", "BC", "QC"].includes(loc.state)) return "canada";
  if (loc.state === "NL") return "mexico";
  if (loc.state === "Panama") return "panama";
  return "us";
}

/**
 * Multi-select for FNS locations: searchable dropdown (Popover + Command)
 * grouped by country and sorted by name, removable chips for the current
 * selection, and a fixed "Add location" row that opens a mini dialog for
 * custom locations.
 */
export function LocationMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useT();
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
                ? t("incidents.locations.select")
                : value.length === 1
                  ? t("incidents.locations.selected.one", { count: value.length })
                  : t("incidents.locations.selected.many", { count: value.length })}
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
            <CommandInput placeholder={t("incidents.locations.searchPlaceholder")} />
            <CommandList>
              <CommandEmpty>{t("incidents.locations.empty")}</CommandEmpty>
              {GROUP_ORDER.map((group) => {
                const members = allLocations
                  .filter((loc) => groupOf(loc) === group)
                  .sort((a, b) => a.name.localeCompare(b.name));
                if (members.length === 0) return null;
                return (
                  <CommandGroup key={group} heading={t(GROUP_LABEL_KEYS[group])}>
                    {members.map((loc) => {
                      const selected = value.includes(loc.id);
                      return (
                        <CommandItem
                          key={loc.id}
                          value={`${loc.name} ${loc.city} ${loc.state} ${loc.id}`}
                          data-checked={selected}
                          onSelect={() => toggle(loc.id)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-foreground">
                              {loc.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {loc.address ||
                                `${loc.city}${loc.city && loc.state ? ", " : ""}${loc.state}`}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
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
                {t("incidents.locations.add")}
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
                aria-label={t("incidents.locations.remove", { name: loc.name })}
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
