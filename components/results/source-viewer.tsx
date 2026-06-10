"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  File01Icon,
  FileSearchIcon,
  QuoteDownIcon,
} from "@hugeicons/core-free-icons";
import type {
  InterviewSession,
  QAItem,
  SourceCitation,
  UploadedFileSourceType,
} from "@/lib/types";
import { charCount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImportanceBadge } from "@/components/importance-badge";

/** Dictionary keys per source type; resolved with t() at render time. */
const SOURCE_TYPE_LABEL_KEYS: Record<UploadedFileSourceType, string> = {
  transcript: "results.viewer.sourceType.transcript",
  manual_notes: "results.viewer.sourceType.manualNotes",
  unknown: "results.viewer.sourceType.unknown",
};

type HighlightSpan = { start: number; end: number };

/**
 * Locate the cited span inside the document text.
 * Prefer the stored character range when it actually contains the quote,
 * otherwise fall back to a plain text search. Returns null when the quote
 * cannot be located at all.
 */
function resolveCitationSpan(
  content: string,
  citation: SourceCitation
): HighlightSpan | null {
  const { quote, startChar, endChar } = citation;
  if (
    typeof startChar === "number" &&
    typeof endChar === "number" &&
    startChar >= 0 &&
    endChar > startChar &&
    endChar <= content.length
  ) {
    const slice = content.slice(startChar, endChar);
    if (quote && (slice === quote || slice.includes(quote))) {
      return { start: startChar, end: endChar };
    }
  }
  if (quote) {
    const idx = content.indexOf(quote);
    if (idx >= 0) return { start: idx, end: idx + quote.length };
  }
  return null;
}

function DocumentText({
  content,
  highlight,
  markRef,
}: {
  content: string;
  highlight: HighlightSpan | null;
  markRef: React.RefObject<HTMLElement | null>;
}) {
  if (!highlight) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {content}
      </p>
    );
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {content.slice(0, highlight.start)}
      <mark ref={markRef} className="rounded-[2px] bg-highlight px-0.5">
        {content.slice(highlight.start, highlight.end)}
      </mark>
      {content.slice(highlight.end)}
    </p>
  );
}

function PreviewPlaceholder({
  icon,
  destructive,
  title,
  description,
}: {
  icon: typeof FileSearchIcon;
  destructive?: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-xs text-center">
        <HugeiconsIcon
          icon={icon}
          size={26}
          strokeWidth={1.5}
          className={cn(
            "mx-auto",
            destructive ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Wide right-hand sheet that pairs a Q&A finding with its citations and a
 * full document preview where the cited span is highlighted in place.
 */
export function SourceViewer({
  session,
  item,
  open,
  onOpenChange,
}: {
  session: InterviewSession;
  item: QAItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const [answerExpanded, setAnswerExpanded] = useState(false);
  const markRef = useRef<HTMLElement | null>(null);

  // Reset citation selection when a different Q&A item is opened.
  const itemId = item?.id;
  const [prevItemId, setPrevItemId] = useState(itemId);
  if (itemId !== prevItemId) {
    setPrevItemId(itemId);
    setActiveIndex(0);
    setAnswerExpanded(false);
  }

  const citations = useMemo(() => item?.sourceCitations ?? [], [item]);
  const safeIndex = Math.min(activeIndex, Math.max(citations.length - 1, 0));
  const activeCitation = citations.length > 0 ? citations[safeIndex] : null;
  const file = activeCitation
    ? session.uploadedFiles.find((f) => f.id === activeCitation.fileId)
    : undefined;

  const highlight = useMemo(() => {
    if (!file || !activeCitation) return null;
    return resolveCitationSpan(file.contentText, activeCitation);
  }, [file, activeCitation]);

  // Bring the cited span into view when the sheet opens or the citation
  // changes. The delay lets the sheet finish mounting its slide-in frame.
  useEffect(() => {
    if (!open || !highlight) return;
    const t = window.setTimeout(() => {
      markRef.current?.scrollIntoView({ block: "center" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, itemId, safeIndex, highlight]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl data-[side=right]:lg:max-w-4xl"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <SheetTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={QuoteDownIcon}
              size={15}
              strokeWidth={1.8}
              className="text-muted-foreground"
            />
            {t("results.viewer.title")}
          </SheetTitle>
          <SheetDescription>{t("results.viewer.description")}</SheetDescription>
        </SheetHeader>

        {item && (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Left: Q&A summary and citation list */}
            <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b p-4 md:max-h-none md:w-2/5 md:border-b-0 md:border-r">
              <div className="flex flex-wrap items-center gap-2">
                <ImportanceBadge importance={item.importance} />
                {item.timestampLabel && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.timestampLabel}
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <span className="pt-0.5 font-mono text-xs font-semibold text-primary">
                  Q.
                </span>
                <p className="min-w-0 text-sm font-medium leading-relaxed text-foreground">
                  {item.question}
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="pt-0.5 font-mono text-xs font-semibold text-muted-foreground">
                  A.
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground",
                      !answerExpanded && "line-clamp-3"
                    )}
                  >
                    {item.answer}
                  </p>
                  {item.answer.length > 120 && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-primary transition-colors duration-150 hover:underline"
                      onClick={() => setAnswerExpanded((v) => !v)}
                    >
                      {answerExpanded
                        ? t("results.viewer.showLess")
                        : t("results.viewer.showMore")}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("results.viewer.citations")}
                </h3>
                {citations.length > 1 && (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {t("results.viewer.citationOf", {
                        current: safeIndex + 1,
                        total: citations.length,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("results.viewer.prevCitation")}
                      disabled={safeIndex === 0}
                      onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                    >
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={14}
                        strokeWidth={1.8}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("results.viewer.nextCitation")}
                      disabled={safeIndex >= citations.length - 1}
                      onClick={() =>
                        setActiveIndex((i) =>
                          Math.min(citations.length - 1, i + 1)
                        )
                      }
                    >
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        strokeWidth={1.8}
                      />
                    </Button>
                  </div>
                )}
              </div>

              {citations.length === 0 ? (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    size={14}
                    strokeWidth={1.8}
                    className="mt-0.5 shrink-0"
                  />
                  {t("results.noCitationWarning")}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {citations.map((citation, i) => (
                    <button
                      key={`${citation.fileId}-${i}`}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        "w-full rounded-md border bg-card p-2.5 text-left transition-colors duration-150 hover:bg-muted/50",
                        i === safeIndex ? "border-primary" : "border-border"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-foreground">
                          {citation.fileName}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {Math.round(citation.confidence * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {citation.quote}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: document preview with highlighted span */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {!activeCitation ? (
                <PreviewPlaceholder
                  icon={FileSearchIcon}
                  title={t("results.viewer.noDocTitle")}
                  description={t("results.viewer.noDocDescription")}
                />
              ) : !file ? (
                <PreviewPlaceholder
                  icon={Alert02Icon}
                  destructive
                  title={t("results.viewer.fileMissingTitle")}
                  description={t("results.viewer.fileMissingDescription")}
                />
              ) : (
                <>
                  <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-3">
                    <HugeiconsIcon
                      icon={File01Icon}
                      size={15}
                      strokeWidth={1.8}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">
                      {file.fileName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t(SOURCE_TYPE_LABEL_KEYS[file.sourceType])}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {charCount(file.contentText)}
                    </span>
                  </div>
                  {!highlight && (
                    <div className="flex shrink-0 items-center gap-2 border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
                      <HugeiconsIcon
                        icon={Alert02Icon}
                        size={14}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                      {t("results.viewer.quoteNotFound")}
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <DocumentText
                      content={file.contentText}
                      highlight={highlight}
                      markRef={markRef}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
