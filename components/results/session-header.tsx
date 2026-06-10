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
import { UNKNOWN_INTERVIEWEE } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
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
  const updateInterviewSession = useFAAStore((s) => s.updateInterviewSession);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState("");

  const displayName = session.intervieweeName?.trim()
    ? session.intervieweeName.trim()
    : UNKNOWN_INTERVIEWEE;
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
    toast.success("Interviewee name updated.");
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
    toast.success("Session updated.");
  }

  return (
    <header>
      <Link
        href={`/incidents/${incidentId}?tab=interview`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
        Back to incident
      </Link>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Interview session
      </p>

      {editing ? (
        <div className="mt-1.5 flex w-full max-w-md items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Interviewee name"
            aria-label="Interviewee name"
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <Button size="sm" onClick={save}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-0.5 flex items-center gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit interviewee name"
            onClick={startEditing}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={1.8} />
          </Button>
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>
          Extracted {formatDateTime(session.createdAt)} &middot; {fileCount}{" "}
          {fileCount === 1 ? "source file" : "source files"} &middot;{" "}
          {findingCount} {findingCount === 1 ? "finding" : "findings"}
        </span>
        <span aria-hidden="true">&middot;</span>
        {editingDate ? (
          <span className="inline-flex items-center gap-1.5">
            <Input
              autoFocus
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              aria-label="Interview date"
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
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setEditingDate(false)}
            >
              Cancel
            </Button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            {session.interviewDate
              ? `Interview ${formatDate(session.interviewDate)}`
              : "No interview date"}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit interview date"
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
