"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { ExtractionStage } from "@/lib/extraction/extract";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Pipeline stages in execution order, matching lib/extraction/extract.ts. */
export const PIPELINE_STAGES: ExtractionStage[] = [
  "Parsing source files",
  "Identifying interview structure",
  "Extracting Q&A pairs",
  "Scoring importance",
  "Attaching source citations",
];

/** Dictionary keys for the stage values emitted by lib/extraction/extract.ts. */
const STAGE_KEYS: Record<ExtractionStage, string> = {
  "Parsing source files": "extraction.stage.parsing",
  "Identifying interview structure": "extraction.stage.structure",
  "Extracting Q&A pairs": "extraction.stage.extracting",
  "Scoring importance": "extraction.stage.scoring",
  "Attaching source citations": "extraction.stage.citations",
};

type ExtractionProgressProps = {
  status: "running" | "empty" | "error";
  stage: ExtractionStage;
  percent: number;
  errorMessage: string | null;
  /** Q&A pairs extracted before the importance filter removed them all. */
  filteredOutCount: number;
  /** "Interviewee 2 of 4: name" line when extracting multiple groups. */
  groupLabel?: string | null;
  onRetry: () => void;
  onBackToFiles: () => void;
  onBackToRules: () => void;
};

export function ExtractionProgress({
  status,
  stage,
  percent,
  errorMessage,
  filteredOutCount,
  groupLabel,
  onRetry,
  onBackToFiles,
  onBackToRules,
}: ExtractionProgressProps) {
  const t = useT();
  if (status === "empty") {
    if (filteredOutCount > 0) {
      return (
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-14 text-center">
            <HugeiconsIcon
              icon={Alert02Icon}
              size={28}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
            <div>
              <h2 className="text-sm font-semibold">
                {t("extraction.progress.filteredTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredOutCount === 1
                  ? t("extraction.progress.filtered.one")
                  : t("extraction.progress.filtered.many", {
                      count: filteredOutCount,
                    })}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={onBackToRules}>
                {t("extraction.progress.backToRules")}
              </Button>
              <Button variant="outline" onClick={onBackToFiles}>
                {t("extraction.progress.backToFiles")}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-14 text-center">
          <HugeiconsIcon
            icon={Alert02Icon}
            size={28}
            strokeWidth={1.5}
            className="text-muted-foreground"
          />
          <div>
            <h2 className="text-sm font-semibold">
              {t("extraction.progress.emptyTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("extraction.progress.emptyDescription")}
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={onBackToFiles}>
            {t("extraction.progress.backToFiles")}
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 px-6 py-14 text-center">
          <HugeiconsIcon
            icon={Alert02Icon}
            size={28}
            strokeWidth={1.5}
            className="text-destructive"
          />
          <div>
            <h2 className="text-sm font-semibold">
              {t("extraction.progress.errorTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {errorMessage ?? t("extraction.progress.errorFallback")}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button onClick={onRetry}>{t("extraction.progress.retry")}</Button>
            <Button variant="outline" onClick={onBackToFiles}>
              {t("extraction.progress.backToFiles")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = PIPELINE_STAGES.indexOf(stage);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("extraction.progress.title")}
        </CardTitle>
        <CardDescription className="text-sm">
          {t("extraction.progress.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {groupLabel && (
          <p className="font-mono text-xs text-muted-foreground">{groupLabel}</p>
        )}
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t(STAGE_KEYS[stage])}</span>
            <span className="font-mono text-xs text-muted-foreground">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ol className="flex flex-col gap-2.5">
          {PIPELINE_STAGES.map((s, i) => {
            const done = i < currentIndex || (i === currentIndex && percent >= 100);
            const current = i === currentIndex && percent < 100;
            return (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-2.5 text-sm",
                  current && "font-medium text-foreground",
                  !current && !done && "text-muted-foreground",
                  done && "text-foreground"
                )}
              >
                {done ? (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-primary"
                  />
                ) : (
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <span
                      className={cn(
                        "size-2 rounded-full border",
                        current ? "border-primary bg-primary/20" : "border-border"
                      )}
                    />
                  </span>
                )}
                {t(STAGE_KEYS[s])}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
