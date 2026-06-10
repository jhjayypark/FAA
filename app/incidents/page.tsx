"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderDetailsIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useFAAStore, useHydrated } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddIncidentDialog } from "@/components/incidents/add-incident-dialog";
import { IncidentRow } from "@/components/incidents/incident-row";

function IncidentListSkeleton() {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Skeleton className="h-6 w-14" />
            <Skeleton className="size-6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center">
      <HugeiconsIcon
        icon={FolderDetailsIcon}
        size={28}
        strokeWidth={1.5}
        className="text-muted-foreground"
      />
      <h2 className="mt-4 text-sm font-semibold">No incidents yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create an incident to start organizing interviews, evidence, and audit
        findings.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.8} />
        Add Incident
      </Button>
    </div>
  );
}

export default function IncidentsPage() {
  const hydrated = useHydrated();
  const incidents = useFAAStore((s) => s.incidents);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage audit incidents, interviews, and findings.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="self-start md:shrink-0">
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.8} />
          Add Incident
        </Button>
      </div>

      {!hydrated ? (
        <IncidentListSkeleton />
      ) : incidents.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>
      )}

      <AddIncidentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
