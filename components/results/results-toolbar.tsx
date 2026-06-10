"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PresentationBarChart01Icon } from "@hugeicons/core-free-icons";
import { useT } from "@/lib/i18n";
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
  const t = useT();
  return (
    <div className="sticky top-0 z-10 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="w-52" aria-label={t("results.toolbar.sortAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">{t("results.toolbar.sortTime")}</SelectItem>
            <SelectItem value="importance-desc">
              {t("results.toolbar.sortImportanceDesc")}
            </SelectItem>
            <SelectItem value="importance-asc">
              {t("results.toolbar.sortImportanceAsc")}
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Checkbox
            id="important-only"
            checked={importantOnly}
            onCheckedChange={(v) => onImportantOnlyChange(v === true)}
          />
          <Label htmlFor="important-only" className="text-xs font-medium">
            {t("results.toolbar.importantOnly")}
          </Label>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-xs text-muted-foreground">
            {t("results.inReportCount", {
              selected: includedCount,
              total: totalCount,
            })}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex rounded-md">
                  <Button variant="outline" disabled>
                    {t("results.toolbar.exportPdf")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("results.toolbar.exportPdfTooltip")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={onGeneratePptx}>
            <HugeiconsIcon icon={PresentationBarChart01Icon} size={14} strokeWidth={1.8} />
            {t("results.toolbar.generatePptx")}
          </Button>
        </div>
      </div>
    </div>
  );
}
