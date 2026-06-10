"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  Download01Icon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import type { Incident, InterviewSession, ReportOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { locationById, useAllLocations } from "@/lib/store";
import { generatePptx } from "@/lib/report/generate-pptx";
import { buildSlideModels } from "@/components/report/slide-model";
import { SlidePreview } from "@/components/report/slide-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_THEME = "#1F3A5F";
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

type IncludeKey = "context" | "locations" | "badges" | "citations" | "appendix";

const INCLUDE_FIELDS: Array<{ key: IncludeKey; label: string }> = [
  { key: "context", label: "Incident context" },
  { key: "locations", label: "Involved locations" },
  { key: "badges", label: "Importance badges" },
  { key: "citations", label: "Source citations" },
  { key: "appendix", label: "Appendix with all selected Q&A" },
];

function normalizeHex(value: string): string {
  return `#${value.trim().replace(/^#/, "").toUpperCase()}`;
}

export function ReportDialog({
  incident,
  session,
  open,
  onOpenChange,
}: {
  incident: Incident;
  session: InterviewSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [view, setView] = useState<"options" | "preview">("options");
  const [title, setTitle] = useState(`${incident.name} Interview Findings`);
  const [hexInput, setHexInput] = useState(DEFAULT_THEME);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME);
  const [templateFileName, setTemplateFileName] = useState<string | undefined>(undefined);
  const [includes, setIncludes] = useState<Record<IncludeKey, boolean>>({
    context: true,
    locations: true,
    badges: true,
    citations: true,
    appendix: true,
  });
  const [downloading, setDownloading] = useState(false);

  // Reopening always starts at the options view; chosen options are kept.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setView("options");
      setDownloading(false);
    }
  }

  const allLocations = useAllLocations();
  const locationNames = useMemo(
    () =>
      incident.involvedLocationIds
        .map((id) => locationById(allLocations, id)?.name)
        .filter((name): name is string => Boolean(name)),
    [incident.involvedLocationIds, allLocations]
  );

  const includedCount = useMemo(
    () => session.qaItems.filter((q) => q.includedInReport).length,
    [session.qaItems]
  );

  const titleValid = title.trim().length > 0;
  const hexValid = HEX_RE.test(hexInput.trim());
  const canGenerate = titleValid && hexValid && includedCount > 0;

  const reportOptions: ReportOptions = useMemo(
    () => ({
      title: title.trim(),
      themeColor,
      includeIncidentContext: includes.context,
      includeLocations: includes.locations,
      includeImportanceBadges: includes.badges,
      includeCitations: includes.citations,
      includeAppendix: includes.appendix,
      templateFileName,
    }),
    [title, themeColor, includes, templateFileName]
  );

  const slides = useMemo(
    () =>
      view === "preview"
        ? buildSlideModels({ incident, session, options: reportOptions, locationNames })
        : [],
    [view, incident, session, reportOptions, locationNames]
  );

  function handleHexInput(value: string) {
    setHexInput(value);
    if (HEX_RE.test(value.trim())) {
      setThemeColor(normalizeHex(value));
    }
  }

  function handleSwatch(value: string) {
    const normalized = normalizeHex(value);
    setHexInput(normalized);
    setThemeColor(normalized);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await generatePptx({ incident, session, options: reportOptions });
      toast.success("PPTX downloaded.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Failed to generate the PPTX file."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0",
          view === "options" ? "sm:max-w-3xl" : "sm:max-w-5xl"
        )}
      >
        {view === "options" ? (
          <>
            <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4 pr-12">
              <DialogTitle>Generate PPTX Report</DialogTitle>
              <DialogDescription>
                Configure the report content, then preview the slides before downloading.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-title">Report title</Label>
                  <Input
                    id="report-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={!titleValid}
                  />
                  {!titleValid && (
                    <p className="text-xs text-destructive">Report title is required.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-hex">Theme color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hexValid ? normalizeHex(hexInput) : themeColor}
                      onChange={(e) => handleSwatch(e.target.value)}
                      aria-label="Theme color swatch"
                      className="h-7 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                    />
                    <Input
                      id="report-hex"
                      value={hexInput}
                      onChange={(e) => handleHexInput(e.target.value)}
                      className="w-32 font-mono"
                      aria-invalid={!hexValid}
                      spellCheck={false}
                    />
                  </div>
                  {!hexValid && (
                    <p className="text-xs text-destructive">
                      Enter a valid 6 digit hex color, for example #1F3A5F.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="report-template">PPTX template (optional)</Label>
                  <Input
                    id="report-template"
                    type="file"
                    accept=".pptx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setTemplateFileName(file ? file.name : undefined);
                    }}
                  />
                  {templateFileName && (
                    <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={14}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Template uploaded. Template styling will be supported in the next
                        version.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <p className="text-xs leading-none font-medium">Include in report</p>
                  <div className="flex flex-col gap-2.5">
                    {INCLUDE_FIELDS.map((field) => (
                      <div key={field.key} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`include-${field.key}`}
                          checked={includes[field.key]}
                          onCheckedChange={(checked) =>
                            setIncludes((s) => ({ ...s, [field.key]: checked === true }))
                          }
                        />
                        <Label htmlFor={`include-${field.key}`} className="font-normal">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {includedCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {includedCount} selected Q&A {includedCount === 1 ? "item" : "items"} will
                    be included.
                  </p>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                    <HugeiconsIcon
                      icon={Alert02Icon}
                      size={14}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-destructive"
                    />
                    <p className="text-xs text-destructive">
                      No Q&A cards are selected for the report. Select cards on the results
                      page first.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t px-5 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setView("preview")} disabled={!canGenerate}>
                Generate Preview
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4 pr-12">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <DialogTitle>Report Preview</DialogTitle>
                  <DialogDescription>
                    {slides.length} {slides.length === 1 ? "slide" : "slides"}. Review the
                    layout, then download the PPTX file.
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setView("options")}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
                  Back to options
                </Button>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-5 py-5">
              <SlidePreview slides={slides} options={reportOptions} />
            </div>

            <DialogFooter className="shrink-0 border-t px-5 py-4">
              <Button
                variant="outline"
                onClick={() => setView("options")}
                disabled={downloading}
              >
                Back
              </Button>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={14}
                    strokeWidth={1.8}
                    className="animate-spin"
                  />
                ) : (
                  <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={1.8} />
                )}
                Download PPTX
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
