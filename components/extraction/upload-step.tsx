"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CloudUploadIcon,
  Doc01Icon,
  File01Icon,
  Link01Icon,
  PlusSignIcon,
  Txt01Icon,
  Pdf01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { UploadedFileSourceType, UploadedInterviewFile } from "@/lib/types";
import { ACCEPTED_FILE_TYPES } from "@/lib/parse-files";
import { charCount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** One interviewee and their source materials; becomes one interview session. */
export type IntervieweeGroup = {
  id: string;
  name: string;
  files: UploadedInterviewFile[];
};

/** A file currently being parsed, shown as a skeleton row in its group. */
export type ParsingFile = { key: string; fileName: string; groupId: string };

const FILE_ICONS: Record<string, typeof File01Icon> = {
  txt: Txt01Icon,
  md: Txt01Icon,
  docx: Doc01Icon,
  pdf: Pdf01Icon,
  link: Link01Icon,
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
  groups: IntervieweeGroup[];
  parsingFiles: ParsingFile[];
  onAddFiles: (groupId: string, files: File[]) => void;
  onAddLink: (groupId: string, url: string) => Promise<void>;
  onNameChange: (groupId: string, name: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onSourceTypeChange: (
    groupId: string,
    fileId: string,
    sourceType: UploadedFileSourceType
  ) => void;
  onRemoveFile: (groupId: string, fileId: string) => void;
  onContinue: () => void;
};

function GroupCard({
  group,
  index,
  parsing,
  removable,
  onAddFiles,
  onAddLink,
  onNameChange,
  onRemove,
  onSourceTypeChange,
  onRemoveFile,
}: {
  group: IntervieweeGroup;
  index: number;
  parsing: ParsingFile[];
  removable: boolean;
  onAddFiles: (files: File[]) => void;
  onAddLink: (url: string) => Promise<void>;
  onNameChange: (name: string) => void;
  onRemove: () => void;
  onSourceTypeChange: (fileId: string, sourceType: UploadedFileSourceType) => void;
  onRemoveFile: (fileId: string) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [importingLink, setImportingLink] = useState(false);

  const hasRows = group.files.length > 0 || parsing.length > 0;

  async function submitLink() {
    const url = linkUrl.trim();
    if (!url || importingLink) return;
    setImportingLink(true);
    try {
      await onAddLink(url);
      setLinkUrl("");
    } finally {
      setImportingLink(false);
    }
  }

  return (
    <section
      aria-label={group.name || t("extraction.upload.group.unnamed")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length > 0) onAddFiles(dropped);
      }}
      className={cn(
        "rounded-lg border bg-card transition-colors duration-150",
        dragActive ? "border-primary bg-muted/50" : "border-border"
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon
            icon={UserIcon}
            size={15}
            strokeWidth={1.8}
            className="text-primary"
          />
        </span>
        <Input
          value={group.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("extraction.upload.group.namePlaceholder")}
          aria-label={t("extraction.upload.group.nameAria", { index: index + 1 })}
          className="h-8 max-w-72 border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-input focus-visible:border-input"
        />
        {removable && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={t("extraction.upload.group.removeAria", {
              name: group.name || t("extraction.upload.group.unnamed"),
            })}
            onClick={onRemove}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
          </Button>
        )}
      </div>

      {hasRows ? (
        <ul className="divide-y divide-border">
          {group.files.map((file) => {
            const Icon = iconForExtension(file.fileType);
            return (
              <li key={file.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
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
          {parsing.map((p) => (
            <li key={p.key} className="flex items-center gap-3 px-4 py-2.5">
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
      ) : (
        <p className="px-4 py-4 text-xs text-muted-foreground">
          {t("extraction.upload.group.empty")}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          <HugeiconsIcon icon={CloudUploadIcon} size={14} strokeWidth={1.8} />
          {t("extraction.upload.group.addFiles")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            if (selected.length > 0) onAddFiles(selected);
            e.target.value = "";
          }}
        />
        <div className="flex min-w-0 flex-1 gap-2">
          <Input
            type="url"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={t("extraction.upload.linkPlaceholder")}
            aria-label={t("extraction.upload.linkLabel")}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submitLink();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={linkUrl.trim().length === 0 || importingLink}
            onClick={() => void submitLink()}
          >
            <HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={1.8} />
            {t("extraction.upload.linkAdd")}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function UploadStep({
  groups,
  parsingFiles,
  onAddFiles,
  onAddLink,
  onNameChange,
  onAddGroup,
  onRemoveGroup,
  onSourceTypeChange,
  onRemoveFile,
  onContinue,
}: UploadStepProps) {
  const t = useT();
  const totalFiles = groups.reduce((n, g) => n + g.files.length, 0);
  const continueDisabled = totalFiles === 0 || parsingFiles.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">{t("extraction.upload.group.heading")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("extraction.upload.group.description")}
        </p>
      </div>

      {groups.map((group, index) => (
        <GroupCard
          key={group.id}
          group={group}
          index={index}
          parsing={parsingFiles.filter((p) => p.groupId === group.id)}
          removable={groups.length > 1}
          onAddFiles={(files) => onAddFiles(group.id, files)}
          onAddLink={(url) => onAddLink(group.id, url)}
          onNameChange={(name) => onNameChange(group.id, name)}
          onRemove={() => onRemoveGroup(group.id)}
          onSourceTypeChange={(fileId, st) => onSourceTypeChange(group.id, fileId, st)}
          onRemoveFile={(fileId) => onRemoveFile(group.id, fileId)}
        />
      ))}

      <Button type="button" variant="outline" className="w-fit" onClick={onAddGroup}>
        <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.8} />
        {t("extraction.upload.group.addPerson")}
      </Button>

      <p className="text-xs text-muted-foreground">{t("extraction.upload.audioNote")}</p>

      <div className="flex justify-end pt-2">
        <Button onClick={onContinue} disabled={continueDisabled}>
          {t("common.continue")}
        </Button>
      </div>
    </div>
  );
}
