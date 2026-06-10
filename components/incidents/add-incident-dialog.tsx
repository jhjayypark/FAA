"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { LocationMultiSelect } from "@/components/incidents/location-multi-select";

/** Modal form for creating a new incident. Navigates to the incident on success. */
export function AddIncidentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const addIncident = useFAAStore((s) => s.addIncident);

  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);

  const nameError = attempted && name.trim().length === 0;

  function resetForm() {
    setName("");
    setContext("");
    setLocationIds([]);
    setAttempted(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (name.trim().length === 0) return;

    const incident = addIncident({
      name: name.trim(),
      context: context.trim() ? context.trim() : undefined,
      involvedLocationIds: locationIds,
    });
    toast.success("Incident created.");
    resetForm();
    onOpenChange(false);
    router.push(`/incidents/${incident.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Incident</DialogTitle>
          <DialogDescription>
            Create an incident to organize interviews, evidence, and findings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="incident-name">Incident Name</Label>
            <Input
              id="incident-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Inventory discrepancy, Carson warehouse"
              aria-invalid={nameError || undefined}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">Incident name is required.</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="incident-context">Incident Context</Label>
            <Textarea
              id="incident-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              placeholder="Describe what happened, why this audit is being opened, known background, relevant teams, timeline, or concerns."
            />
          </div>
          <div className="grid gap-2">
            <Label>Involved FNS Locations</Label>
            <LocationMultiSelect value={locationIds} onChange={setLocationIds} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Incident</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
