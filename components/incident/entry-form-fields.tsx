"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  GitCommitIcon,
  StickyNote01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { OverviewEntry, OverviewEntryType } from "@/lib/types";
import { useT } from "@/lib/i18n";
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
  /** Value of the date input (yyyy-mm-dd). */
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
  { labelKey: string; icon: typeof UserIcon }
> = {
  interview: {
    labelKey: "incidentDetail.entryType.interview",
    icon: Calendar03Icon,
  },
  person: { labelKey: "incidentDetail.entryType.person", icon: UserIcon },
  timeline: {
    labelKey: "incidentDetail.entryType.timeline",
    icon: GitCommitIcon,
  },
  note: { labelKey: "incidentDetail.entryType.note", icon: StickyNote01Icon },
};

export function emptyDraft(type: OverviewEntryType = "interview"): EntryDraft {
  return { type, title: "", dateTimeLocal: "", people: "", description: "" };
}

/**
 * Stored value to the "yyyy-mm-dd" format expected by date inputs.
 * Handles both date-only values and legacy full ISO datetimes.
 */
export function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date inputs already produce "yyyy-mm-dd"; store it verbatim (no timezone math). */
export function localInputToIso(value: string): string | undefined {
  return value || undefined;
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
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-2 sm:w-36">
          <Label htmlFor={`${idPrefix}-type`}>
            {t("incidentDetail.form.type")}
          </Label>
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
                    {t(meta.labelKey)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`${idPrefix}-title`}>
            {t("incidentDetail.form.title")}
          </Label>
          <Input
            id={`${idPrefix}-title`}
            autoFocus={autoFocusTitle}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t("incidentDetail.form.titlePlaceholder")}
          />
        </div>
      </div>

      {draft.type === "interview" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-datetime`}>
              {t("incidentDetail.form.dateTime")}
            </Label>
            <Input
              id={`${idPrefix}-datetime`}
              type="date"
              value={draft.dateTimeLocal}
              onChange={(e) => onChange({ dateTimeLocal: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-people`}>
              {t("incidentDetail.form.people")}
            </Label>
            <Input
              id={`${idPrefix}-people`}
              value={draft.people}
              onChange={(e) => onChange({ people: e.target.value })}
              placeholder="김민수, 박지현"
            />
            <p className="text-xs text-muted-foreground">
              {t("incidentDetail.form.peopleHelp")}
            </p>
          </div>
        </div>
      )}

      {draft.type === "person" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-role`}>
            {t("incidentDetail.form.role")}
          </Label>
          <Input
            id={`${idPrefix}-role`}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={t("incidentDetail.form.rolePlaceholder")}
          />
        </div>
      )}

      {draft.type === "timeline" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor={`${idPrefix}-datetime`}>
              {t("incidentDetail.form.dateTime")}
            </Label>
            <Input
              id={`${idPrefix}-datetime`}
              type="date"
              value={draft.dateTimeLocal}
              onChange={(e) => onChange({ dateTimeLocal: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-details`}>
              {t("incidentDetail.form.details")}
            </Label>
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
          <Label htmlFor={`${idPrefix}-details`}>
            {t("incidentDetail.form.details")}
          </Label>
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
