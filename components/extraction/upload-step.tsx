"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CloudUploadIcon,
  Doc01Icon,
  File01Icon,
  Pdf01Icon,
  Txt01Icon,
} from "@hugeicons/core-free-icons";
import type { UploadedFileSourceType, UploadedInterviewFile } from "@/lib/types";
import { ACCEPTED_FILE_TYPES } from "@/lib/parse-files";
import { charCount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** A file currently being parsed, shown as a skeleton row. */
export type ParsingFile = { key: string; fileName: string };

const FILE_ICONS: Record<string, typeof File01Icon> = {
  txt: Txt01Icon,
  md: Txt01Icon,
  docx: Doc01Icon,
  pdf: Pdf01Icon,
};

function iconForExtension(ext: string) {
  return FILE_ICONS[ext] ?? File01Icon;
}

const SOURCE_TYPE_OPTIONS: { value: UploadedFileSourceType; labelKey: string }[] = [
  { value: "transcript", labelKey: "extraction.upload.sourceType.transcript" },
  { value: "manual_notes", labelKey: "extraction.upload.sourceType.manualNotes" },
  { value: "unknown", labelKey: "extraction.upload.sourceType.unknown" },
];

type UploadStepProps = {
  files: UploadedInterviewFile[];
  parsingFiles: ParsingFile[];
  onAddFiles: (files: File[]) => void;
  onSourceTypeChange: (fileId: string, sourceType: UploadedFileSourceType) => void;
  onRemoveFile: (fileId: string) => void;
  onContinue: () => void;
};

export function UploadStep({
  files,
  parsingFiles,
  onAddFiles,
  onSourceTypeChange,
  onRemoveFile,
  onContinue,
}: UploadStepProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const hasRows = files.length > 0 || parsingFiles.length > 0;
  const continueDisabled = files.length === 0 || parsingFiles.length > 0;

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onAddFiles(dropped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) onAddFiles(selected);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label={t("extraction.upload.dropzoneAria")}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center transition-colors duration-150",
          dragActive
            ? "border-primary bg-muted/60"
            : "border-border hover:border-primary/40 hover:bg-muted/40"
        )}
      >
        <HugeiconsIcon
          icon={CloudUploadIcon}
          size={28}
          strokeWidth={1.5}
          className="text-muted-foreground"
        />
        <p className="text-sm font-medium text-foreground">
          {t("extraction.upload.dropTitle")}
        </p>
        <p className="text-xs text-muted-foreground">{t("extraction.upload.formats")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleInputChange}
      />
      <p className="text-xs text-muted-foreground">
        {t("extraction.upload.audioNote")}
      </p>

      {hasRows && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((file) => {
            const Icon = iconForExtension(file.fileType);
            return (
              <li key={file.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <HugeiconsIcon
                    icon={Icon}
                    size={16}
                    strokeWidth={1.8}
                    className="text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.fileName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {charCount(file.contentText)}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <Select
                    value={file.sourceType}
                    onValueChange={(value) =>
                      onSourceTypeChange(file.id, value as UploadedFileSourceType)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-32"
                      aria-label={t("extraction.upload.sourceTypeAria", {
                        fileName: file.fileName,
                      })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("extraction.upload.removeAria", {
                      fileName: file.fileName,
                    })}
                    onClick={() => onRemoveFile(file.id)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
                  </Button>
                </div>
              </li>
            );
          })}
          {parsingFiles.map((p) => (
            <li key={p.key} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {p.fileName}
                </p>
                <Skeleton className="mt-1.5 h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-32 shrink-0" />
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onContinue} disabled={continueDisabled}>
          {t("common.continue")}
        </Button>
      </div>
    </div>
  );
}
