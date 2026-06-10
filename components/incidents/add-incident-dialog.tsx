"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const t = useT();
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
    toast.success(t("incidents.toast.created"));
    resetForm();
    onOpenChange(false);
    router.push(`/incidents/${incident.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("incidents.add")}</DialogTitle>
          <DialogDescription>{t("incidents.addDialog.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="incident-name">{t("incidents.form.name")}</Label>
            <Input
              id="incident-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("incidents.form.namePlaceholder")}
              aria-invalid={nameError || undefined}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">
                {t("incidents.form.nameRequired")}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="incident-context">{t("incidents.form.context")}</Label>
            <Textarea
              id="incident-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              placeholder={t("incidents.form.contextPlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("incidents.form.locations")}</Label>
            <LocationMultiSelect value={locationIds} onChange={setLocationIds} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("incidents.form.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
