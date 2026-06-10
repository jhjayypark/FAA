"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  PencilEdit01Icon,
  QuoteDownIcon,
} from "@hugeicons/core-free-icons";
import type { Importance, QAItem } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportanceBadge } from "@/components/importance-badge";

/**
 * One extracted Q&A finding. Supports report inclusion, inline editing,
 * and opening the source viewer for its citations.
 */
export function QACard({
  incidentId,
  sessionId,
  item,
  dimmed,
  onViewSource,
}: {
  incidentId: string;
  sessionId: string;
  item: QAItem;
  /** Important-only mode de-emphasizes Low cards without hiding them. */
  dimmed: boolean;
  onViewSource: (qaId: string) => void;
}) {
  const t = useT();
  const updateQAItem = useFAAStore((s) => s.updateQAItem);
  const [editing, setEditing] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [draftImportance, setDraftImportance] = useState<Importance>("Medium");
  const [draftReason, setDraftReason] = useState("");
  const [editError, setEditError] = useState("");

  const citationCount = item.sourceCitations.length;

  function startEdit() {
    setDraftQuestion(item.question);
    setDraftAnswer(item.answer);
    setDraftImportance(item.importance);
    setDraftReason(item.importanceReason ?? "");
    setEditError("");
    setEditing(true);
  }

  function saveEdit() {
    const question = draftQuestion.trim();
    const answer = draftAnswer.trim();
    if (!question || !answer) {
      setEditError(t("results.card.emptyError"));
      return;
    }
    updateQAItem(incidentId, sessionId, item.id, {
      question,
      answer,
      importance: draftImportance,
      importanceReason: draftReason.trim() || undefined,
      isManuallyEdited: true,
    });
    setEditing(false);
    toast.success(t("results.card.updated"));
  }

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 sm:p-5",
        dimmed && !editing && "opacity-60 grayscale"
      )}
    >
      {editing ? (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor={`qa-question-${item.id}`}>
              {t("results.card.question")}
            </Label>
            <Textarea
              id={`qa-question-${item.id}`}
              value={draftQuestion}
              onChange={(e) => setDraftQuestion(e.target.value)}
              className="text-[15px] leading-relaxed md:text-[15px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`qa-answer-${item.id}`}>
              {t("results.card.answer")}
            </Label>
            <Textarea
              id={`qa-answer-${item.id}`}
              value={draftAnswer}
              onChange={(e) => setDraftAnswer(e.target.value)}
              className="text-[15px] leading-relaxed md:text-[15px]"
            />
          </div>
          <div className="grid gap-2">
            <Label id={`qa-importance-label-${item.id}`}>
              {t("results.card.importance")}
            </Label>
            <Select
              value={draftImportance}
              onValueChange={(v) => setDraftImportance(v as Importance)}
            >
              <SelectTrigger
                className="w-36"
                aria-labelledby={`qa-importance-label-${item.id}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`qa-reason-${item.id}`}>
              {t("results.card.importanceReason")}
            </Label>
            <Textarea
              id={`qa-reason-${item.id}`}
              rows={2}
              value={draftReason}
              onChange={(e) => setDraftReason(e.target.value)}
              className="min-h-12"
            />
          </div>
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={saveEdit}>
              {t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              checked={item.includedInReport}
              onCheckedChange={(v) =>
                updateQAItem(incidentId, sessionId, item.id, {
                  includedInReport: v === true,
                })
              }
              aria-label={t("results.card.includeInReport")}
            />
            <ImportanceBadge importance={item.importance} />
            {item.timestampLabel && (
              <span className="font-mono text-xs text-muted-foreground">
                {item.timestampLabel}
              </span>
            )}
            {item.isManuallyEdited && (
              <span className="text-xs text-muted-foreground">
                {t("results.card.edited")}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewSource(item.id)}
              >
                <HugeiconsIcon icon={QuoteDownIcon} size={13} strokeWidth={1.8} />
                {t("results.card.viewSource")}
              </Button>
              <Button variant="ghost" size="sm" onClick={startEdit}>
                <HugeiconsIcon icon={PencilEdit01Icon} size={13} strokeWidth={1.8} />
                {t("common.edit")}
              </Button>
            </div>
          </div>

          <div className="mt-3.5 space-y-2.5">
            <div className="flex gap-2">
              <span className="pt-1 font-mono text-xs font-semibold text-primary">
                Q.
              </span>
              <p className="min-w-0 text-[15px] font-medium leading-relaxed">
                {item.question}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="pt-1 font-mono text-xs font-semibold text-muted-foreground">
                A.
              </span>
              <p className="min-w-0 text-[15px] leading-relaxed">{item.answer}</p>
            </div>
          </div>

          {item.importanceReason && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium">{t("results.card.reason")}</span>{" "}
              {item.importanceReason}
            </p>
          )}

          {citationCount === 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <HugeiconsIcon
                icon={Alert02Icon}
                size={14}
                strokeWidth={1.8}
                className="shrink-0"
              />
              {t("results.noCitationWarning")}
            </div>
          )}

          <div className="mt-3.5 border-t pt-2.5">
            <span className="font-mono text-xs text-muted-foreground">
              {t(
                citationCount === 1
                  ? "results.card.citations.one"
                  : "results.card.citations.many",
                { count: citationCount }
              )}
            </span>
          </div>
        </>
      )}
    </article>
  );
}
