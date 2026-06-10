"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PresentationBarChart01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SortMode = "time" | "importance-desc" | "importance-asc";

/**
 * Sticky toolbar above the Q&A list: sort order, important-only emphasis,
 * report inclusion counter, and report export actions.
 */
export function ResultsToolbar({
  sort,
  onSortChange,
  importantOnly,
  onImportantOnlyChange,
  includedCount,
  totalCount,
  onGeneratePptx,
}: {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  importantOnly: boolean;
  onImportantOnlyChange: (checked: boolean) => void;
  includedCount: number;
  totalCount: number;
  onGeneratePptx: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="w-52" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Time order</SelectItem>
            <SelectItem value="importance-desc">Importance: High to Low</SelectItem>
            <SelectItem value="importance-asc">Importance: Low to High</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Checkbox
            id="important-only"
            checked={importantOnly}
            onCheckedChange={(v) => onImportantOnlyChange(v === true)}
          />
          <Label htmlFor="important-only" className="text-xs font-medium">
            Show important list only
          </Label>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-xs text-muted-foreground">
            {includedCount} of {totalCount} in report
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex rounded-md">
                  <Button variant="outline" disabled>
                    Export PDF
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>PDF export is coming in a future version.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={onGeneratePptx}>
            <HugeiconsIcon icon={PresentationBarChart01Icon} size={14} strokeWidth={1.8} />
            Generate PPTX
          </Button>
        </div>
      </div>
    </div>
  );
}
