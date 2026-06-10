"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const STEPS = ["Upload Files", "Extraction Rules", "Extract"] as const;

/** Slim three-step header for the extraction guided flow. */
export function ExtractionStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Extraction steps">
      {STEPS.map((label, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={label} className="flex min-w-0 items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="h-px w-6 shrink-0 bg-border sm:w-10" />}
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary font-semibold text-primary",
                  !done && !current && "border-border text-muted-foreground"
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? (
                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  current ? "text-foreground" : "hidden text-muted-foreground sm:inline"
                )}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
