"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { FNSLocation, FNSLocationType } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Store values stay as typed FNSLocationType; labels resolve through t() at render. */
const LOCATION_TYPES: { value: FNSLocationType; labelKey: string }[] = [
  { value: "Office", labelKey: "incidents.locations.type.office" },
  { value: "Warehouse", labelKey: "incidents.locations.type.warehouse" },
  { value: "Logistics Hub", labelKey: "incidents.locations.type.logisticsHub" },
  { value: "Unknown", labelKey: "incidents.locations.type.unknown" },
];

/**
 * Mini dialog for adding a custom FNS location. On save it persists the
 * location via the store and reports the created location to the parent.
 */
export function AddLocationDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (location: FNSLocation) => void;
}) {
  const t = useT();
  const addCustomLocation = useFAAStore((s) => s.addCustomLocation);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [type, setType] = useState<FNSLocationType>("Office");
  const [attempted, setAttempted] = useState(false);

  const nameError = attempted && name.trim().length === 0;

  function resetForm() {
    setName("");
    setAddress("");
    setCity("");
    setStateValue("");
    setType("Office");
    setAttempted(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // This dialog can be mounted inside the Add Incident form tree; stop the
    // synthetic submit event from bubbling into the parent form.
    e.stopPropagation();
    setAttempted(true);
    if (name.trim().length === 0) return;

    const location = addCustomLocation({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: stateValue.trim(),
      type,
    });
    toast.success(t("incidents.toast.locationAdded"));
    onAdded(location);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("incidents.locations.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("incidents.locations.dialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="custom-location-name">
              {t("incidents.locations.name")}
            </Label>
            <Input
              id="custom-location-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("incidents.locations.namePlaceholder")}
              aria-invalid={nameError || undefined}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">
                {t("incidents.locations.nameRequired")}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-location-address">
              {t("incidents.locations.address")}
            </Label>
            <Input
              id="custom-location-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("incidents.locations.addressPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="custom-location-city">
                {t("incidents.locations.city")}
              </Label>
              <Input
                id="custom-location-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom-location-state">
                {t("incidents.locations.state")}
              </Label>
              <Input
                id="custom-location-state"
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                placeholder={t("incidents.locations.statePlaceholder")}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-location-type">
              {t("incidents.locations.type")}
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as FNSLocationType)}>
              <SelectTrigger id="custom-location-type" className="w-full">
                <SelectValue placeholder={t("incidents.locations.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
