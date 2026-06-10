import type { Importance } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<Importance, string> = {
  High: "bg-importance-high-bg text-importance-high border-importance-high-border",
  Medium: "bg-importance-medium-bg text-importance-medium border-importance-medium-border",
  Low: "bg-importance-low-bg text-importance-low border-importance-low-border",
};

/** Importance badge used on Q&A cards, report previews, and sort headers. */
export function ImportanceBadge({
  importance,
  className,
}: {
  importance: Importance;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide",
        STYLES[importance],
        className
      )}
    >
      {importance}
    </span>
  );
}
