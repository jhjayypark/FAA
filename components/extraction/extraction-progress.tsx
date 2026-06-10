"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { ExtractionStage } from "@/lib/extraction/extract";
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

type ExtractionProgressProps = {
  status: "running" | "empty" | "error";
  stage: ExtractionStage;
  percent: number;
  errorMessage: string | null;
  onRetry: () => void;
  onBackToFiles: () => void;
};

export function ExtractionProgress({
  status,
  stage,
  percent,
  errorMessage,
  onRetry,
  onBackToFiles,
}: ExtractionProgressProps) {
  if (status === "empty") {
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
            <h2 className="text-sm font-semibold">No Q&A pairs could be extracted</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The files may not contain recognizable interview dialogue or notes. Review
              the files and try again.
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={onBackToFiles}>
            Back to files
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
            <h2 className="text-sm font-semibold">Extraction failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {errorMessage ?? "An unexpected error occurred during extraction."}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button onClick={onRetry}>Retry</Button>
            <Button variant="outline" onClick={onBackToFiles}>
              Back to files
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
        <CardTitle className="text-base font-semibold">Extracting insights</CardTitle>
        <CardDescription className="text-sm">
          Q&A pairs are being extracted from the uploaded files. Keep this page open.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{stage}</span>
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
                {s}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
