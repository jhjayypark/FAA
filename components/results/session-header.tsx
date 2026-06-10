"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type { InterviewSession } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Results page header: back link, session label, inline-editable interviewee
 * name, and a metadata line (extraction date, file count, finding count).
 */
export function SessionHeader({
  incidentId,
  session,
}: {
  incidentId: string;
  session: InterviewSession;
}) {
  const t = useT();
  const updateInterviewSession = useFAAStore((s) => s.updateInterviewSession);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState("");

  const displayName = session.intervieweeName?.trim()
    ? session.intervieweeName.trim()
    : t("results.header.unknownInterviewee");
  const fileCount = session.uploadedFiles.length;
  const findingCount = session.qaItems.length;

  function startEditing() {
    setDraft(session.intervieweeName ?? "");
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    updateInterviewSession(incidentId, session.id, {
      intervieweeName: trimmed.length > 0 ? trimmed : undefined,
    });
    setEditing(false);
    toast.success(t("results.header.nameUpdated"));
  }

  function startEditingDate() {
    setDateDraft(session.interviewDate ? session.interviewDate.slice(0, 10) : "");
    setEditingDate(true);
  }

  function saveDate() {
    updateInterviewSession(incidentId, session.id, {
      interviewDate: dateDraft ? dateDraft : undefined,
    });
    setEditingDate(false);
    toast.success(t("results.header.sessionUpdated"));
  }

  return (
    <header>
      <Link
        href={`/incidents/${incidentId}?tab=interview`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
        {t("results.header.back")}
      </Link>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {t("results.header.eyebrow")}
      </p>

      {editing ? (
        <div className="mt-1.5 flex w-full max-w-md items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("results.header.intervieweeName")}
            aria-label={t("results.header.intervieweeName")}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <Button size="sm" onClick={save}>
            {t("common.save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      ) : (
        <div className="mt-0.5 flex items-center gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("results.header.editName")}
            onClick={startEditing}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={1.8} />
          </Button>
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>
          {t("results.header.extracted", {
            datetime: formatDateTime(session.createdAt),
          })}{" "}
          &middot;{" "}
          {t(
            fileCount === 1
              ? "results.header.sourceFiles.one"
              : "results.header.sourceFiles.many",
            { count: fileCount }
          )}{" "}
          &middot;{" "}
          {t(
            findingCount === 1
              ? "results.header.findings.one"
              : "results.header.findings.many",
            { count: findingCount }
          )}
        </span>
        <span aria-hidden="true">&middot;</span>
        {editingDate ? (
          <span className="inline-flex items-center gap-1.5">
            <Input
              autoFocus
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              aria-label={t("results.header.dateAria")}
              className="h-7 w-36 font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDate();
                if (e.key === "Escape") setEditingDate(false);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={saveDate}
            >
              {t("common.save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setEditingDate(false)}
            >
              {t("common.cancel")}
            </Button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            {session.interviewDate
              ? t("results.header.interviewDate", {
                  date: formatDate(session.interviewDate),
                })
              : t("results.header.noInterviewDate")}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("results.header.editDate")}
              className="size-6 text-muted-foreground"
              onClick={startEditingDate}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={12} strokeWidth={1.8} />
            </Button>
          </span>
        )}
      </div>
    </header>
  );
}
