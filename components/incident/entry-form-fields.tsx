"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  GitCommitIcon,
  StickyNote01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { OverviewEntry, OverviewEntryType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Editable form state shared by the composer and inline row editing. */
export type EntryDraft = {
  type: OverviewEntryType;
  title: string;
  /** Value of the datetime-local input, not an ISO string. */
  dateTimeLocal: string;
  /** Comma-separated names as typed. */
  people: string;
  description: string;
};

export const ENTRY_TYPE_ORDER: OverviewEntryType[] = [
  "interview",
  "person",
  "timeline",
  "note",
];

export const ENTRY_TYPE_META: Record<
  OverviewEntryType,
  { label: string; icon: typeof UserIcon }
> = {
  interview: { label: "Interview", icon: Calendar03Icon },
  person: { label: "Person", icon: UserIcon },
  timeline: { label: "Timeline", icon: GitCommitIcon },
  note: { label: "Note", icon: StickyNote01Icon },
};

export function emptyDraft(type: OverviewEntryType = "interview"): EntryDraft {
  return { type, title: "", dateTimeLocal: "", people: "", description: "" };
}

/** ISO string to the local value format expected by datetime-local inputs. */
export function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function draftFromEntry(entry: OverviewEntry): EntryDraft {
  return {
    type: entry.type,
    title: entry.title,
    dateTimeLocal: isoToLocalInput(entry.dateTime),
    people: (entry.people ?? []).join(", "),
    description: entry.description ?? "",
  };
}

/** Converts a draft to the persisted entry fields, keeping only fields relevant to the type. */
export function draftToEntryFields(
  draft: EntryDraft
): Omit<OverviewEntry, "id" | "createdAt"> {
  const base = { type: draft.type, title: draft.title.trim() };
  const description = draft.description.trim() || undefined;
  switch (draft.type) {
    case "interview": {
      const people = draft.people
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      return {
        ...base,
        dateTime: localInputToIso(draft.dateTimeLocal),
        people: people.length > 0 ? people : undefined,
        description: undefined,
      };
    }
    case "person":
      return { ...base, description, dateTime: undefined, people: undefined };
    case "timeline":
      return {
        ...base,
        dateTime: localInputToIso(draft.dateTimeLocal),
        description,
        people: undefined,
      };
    case "note":
      return { ...base, description, dateTime: undefined, people: undefined };
  }
}

/**
 * Shared fields for creating and editing overview entries: type selector,
 * title input, and type-specific fields.
 */
export function EntryFields({
  draft,
  onChange,
  idPrefix,
  autoFocusTitle = false,
}: {
  draft: EntryDraft;
  onChange: (patch: Partial<EntryDraft>) => void;
  idPrefix: string;
  autoFocusTitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-2 sm:w-36">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <Select
            value={draft.type}
            onValueChange={(v) => onChange({ type: v as OverviewEntryType })}
          >
            <SelectTrigger className="w-full" id={`${idPrefix}-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_TYPE_ORDER.map((type) => {
                const meta = ENTRY_TYPE_META[type];
                return (
                  <SelectItem key={type} value={type}>
                    <HugeiconsIcon
                      icon={meta.icon}
                      size={14}
                      strokeWidth={1.8}
                      className="text-muted-foreground"
                    />
                    {meta.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`${idPrefix}-title`}>Title</Label>
          <Input
            id={`${idPrefix}-title`}
            autoFocus={autoFocusTitle}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Add interview date, related person, timeline note, or incident detail..."
          />
        </div>
      </div>

      {draft.type === "interview" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-datetime`}>Date and time</Label>
            <Input
              id={`${idPrefix}-datetime`}
              type="datetime-local"
              value={draft.dateTimeLocal}
              onChange={(e) => onChange({ dateTimeLocal: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-people`}>People</Label>
            <Input
              id={`${idPrefix}-people`}
              value={draft.people}
              onChange={(e) => onChange({ people: e.target.value })}
              placeholder="김민수, 박지현"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated names.
            </p>
          </div>
        </div>
      )}

      {draft.type === "person" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-role`}>Role or team</Label>
          <Input
            id={`${idPrefix}-role`}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Warehouse supervisor, inbound team"
          />
        </div>
      )}

      {draft.type === "timeline" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor={`${idPrefix}-datetime`}>Date and time</Label>
            <Input
              id={`${idPrefix}-datetime`}
              type="datetime-local"
              value={draft.dateTimeLocal}
              onChange={(e) => onChange({ dateTimeLocal: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-details`}>Details</Label>
            <Textarea
              id={`${idPrefix}-details`}
              rows={3}
              value={draft.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
        </div>
      )}

      {draft.type === "note" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-details`}>Details</Label>
          <Textarea
            id={`${idPrefix}-details`}
            rows={3}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
