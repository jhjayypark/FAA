"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import type { OverviewEntry } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ENTRY_TYPE_META,
  EntryFields,
  draftFromEntry,
  draftToEntryFields,
  type EntryDraft,
} from "@/components/incident/entry-form-fields";

export function OverviewEntryRow({
  incidentId,
  entry,
}: {
  incidentId: string;
  entry: OverviewEntry;
}) {
  const t = useT();
  const updateOverviewEntry = useFAAStore((s) => s.updateOverviewEntry);
  const deleteOverviewEntry = useFAAStore((s) => s.deleteOverviewEntry);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EntryDraft>(() => draftFromEntry(entry));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = ENTRY_TYPE_META[entry.type];

  const startEdit = () => {
    setDraft(draftFromEntry(entry));
    setEditing(true);
  };

  const handleSave = () => {
    if (!draft.title.trim()) return;
    updateOverviewEntry(incidentId, entry.id, draftToEntryFields(draft));
    setEditing(false);
    toast.success(t("incidentDetail.toast.entryUpdated"));
  };

  const handleDelete = () => {
    deleteOverviewEntry(incidentId, entry.id);
    toast.success(t("incidentDetail.toast.entryDeleted"));
  };

  if (editing) {
    return (
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setEditing(false);
          }
          if (e.key === "Enter" && e.nativeEvent.isComposing) {
            e.preventDefault();
          }
        }}
      >
        <EntryFields
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          idPrefix={`edit-${entry.id}`}
          autoFocusTitle
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={!draft.title.trim()}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <HugeiconsIcon
          icon={meta.icon}
          size={16}
          strokeWidth={1.8}
          className="text-muted-foreground"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{entry.title}</p>
        {entry.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {entry.description}
          </p>
        )}
        {entry.people && entry.people.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {entry.people.map((person) => (
              <span
                key={person}
                className="inline-flex items-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs text-foreground"
              >
                {person}
              </span>
            ))}
          </div>
        )}
        {entry.dateTime && (
          <p className="pt-0.5 font-mono text-xs text-muted-foreground">
            {formatDateTime(entry.dateTime)}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("incidentDetail.entries.rowActions")}
            className="shrink-0 text-muted-foreground"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={15} strokeWidth={1.8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={startEdit}>
            <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.8} />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("incidentDetail.deleteEntry.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("incidentDetail.deleteEntry.description", {
                title: entry.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
