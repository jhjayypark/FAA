"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityCheckIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { MANDATORY_EXTRACTION_RULES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type RulesStepProps = {
  importantOnly: boolean;
  onImportantOnlyChange: (value: boolean) => void;
  onBack: () => void;
  onExtract: () => void;
};

export function RulesStep({
  importantOnly,
  onImportantOnlyChange,
  onBack,
  onExtract,
}: RulesStepProps) {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Extraction Rules</CardTitle>
        <CardDescription className="text-sm">
          How Q&A should be extracted from the source material.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>Style preset</Label>
          <div className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5">
            <HugeiconsIcon
              icon={SecurityCheckIcon}
              size={16}
              strokeWidth={1.8}
              className="shrink-0 text-primary"
            />
            <span className="text-sm font-medium">Strict factual extraction</span>
            <span className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              Required
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Mandatory rules (non-negotiable)</h3>
          <ol className="mt-3 flex flex-col gap-2.5">
            {MANDATORY_EXTRACTION_RULES.map((rule, i) => (
              <li key={rule} className="flex items-start gap-2.5">
                <span className="w-3 shrink-0 pt-0.5 text-right font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={16}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <span className="text-[15px] leading-relaxed">{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="important-only"
            checked={importantOnly}
            onCheckedChange={(v) => onImportantOnlyChange(v === true)}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="important-only" className="text-sm font-medium">
              Extract most important insights only
            </Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Only Q&A pairs most relevant to this incident are extracted. Every item
              still carries source citations. When off, all Q&A pairs are extracted and
              marked with importance.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onExtract}>Extract Insights</Button>
      </CardFooter>
    </Card>
  );
}
