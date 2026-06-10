"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityCheckIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { MANDATORY_EXTRACTION_RULES } from "@/lib/types";
import { useT } from "@/lib/i18n";
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
  const t = useT();
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("extraction.rules.title")}
        </CardTitle>
        <CardDescription className="text-sm">
          {t("extraction.rules.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>{t("extraction.rules.stylePreset")}</Label>
          <div className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5">
            <HugeiconsIcon
              icon={SecurityCheckIcon}
              size={16}
              strokeWidth={1.8}
              className="shrink-0 text-primary"
            />
            <span className="text-sm font-medium">
              {t("extraction.rules.strictFactual")}
            </span>
            <span className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("extraction.rules.required")}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">
            {t("extraction.rules.mandatoryHeading")}
          </h3>
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
              {t("extraction.rules.importantOnly")}
            </Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("extraction.rules.importantOnlyHelp")}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t">
        <Button variant="outline" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button onClick={onExtract}>{t("extraction.rules.extract")}</Button>
      </CardFooter>
    </Card>
  );
}
