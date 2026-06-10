"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { FNSLocation, FNSLocationType } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
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

const LOCATION_TYPES: FNSLocationType[] = ["Office", "Warehouse", "Logistics Hub", "Unknown"];

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
    toast.success("Location added.");
    onAdded(location);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
          <DialogDescription>
            Add an FNS location that is not in the standard list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="custom-location-name">Location name</Label>
            <Input
              id="custom-location-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FNS - City, ST"
              aria-invalid={nameError || undefined}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">Location name is required.</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-location-address">Address</Label>
            <Input
              id="custom-location-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, ST ZIP, US"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="custom-location-city">City</Label>
              <Input
                id="custom-location-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom-location-state">State</Label>
              <Input
                id="custom-location-state"
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                placeholder="CA"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-location-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FNSLocationType)}>
              <SelectTrigger id="custom-location-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
