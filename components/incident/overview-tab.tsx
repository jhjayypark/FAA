"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import type { Incident, OverviewEntry } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EntryFields,
  draftToEntryFields,
  emptyDraft,
  type EntryDraft,
} from "@/components/incident/entry-form-fields";
import { OverviewEntryRow } from "@/components/incident/overview-entry-row";

function sortKey(entry: OverviewEntry): number {
  const iso = entry.dateTime ?? entry.createdAt;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function OverviewTab({ incident }: { incident: Incident }) {
  const t = useT();
  const addOverviewEntry = useFAAStore((s) => s.addOverviewEntry);
  const [draft, setDraft] = useState<EntryDraft>(() => emptyDraft());

  const entries = [...incident.overviewEntries].sort(
    (a, b) => sortKey(a) - sortKey(b)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    addOverviewEntry(incident.id, draftToEntryFields(draft));
    setDraft(emptyDraft(draft.type));
    toast.success(t("incidentDetail.toast.entryAdded"));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("incidentDetail.composer.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.nativeEvent.isComposing) {
                e.preventDefault();
              }
            }}
            className="flex flex-col gap-3"
          >
            <EntryFields
              draft={draft}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              idPrefix="composer"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!draft.title.trim()}>
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  size={14}
                  strokeWidth={1.8}
                  data-icon="inline-start"
                />
                {t("incidentDetail.composer.add")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-border px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            <HugeiconsIcon
              icon={Note01Icon}
              size={18}
              strokeWidth={1.8}
              className="text-muted-foreground"
            />
          </div>
          <p className="mt-1 text-sm font-semibold">
            {t("incidentDetail.entries.emptyTitle")}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("incidentDetail.entries.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {entries.map((entry) => (
            <OverviewEntryRow
              key={entry.id}
              incidentId={incident.id}
              entry={entry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
