"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  DocumentAttachmentIcon,
  PlusSignIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import type { Incident } from "@/lib/types";
import { GENERAL_THREAD } from "@/lib/types";
import { ACCEPTED_FILE_TYPES, FileParseError, parseUploadedFile } from "@/lib/parse-files";
import type { AssistantAttachment } from "@/lib/assistant/answer";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Claude-style prompt card: borderless textarea, attach button, inline
 * incident scope selector, and a round send button. Used centered on the
 * empty thread ("hero") and docked at the bottom of an active thread.
 */
export function Composer({
  variant,
  sending,
  incidents,
  scopeId,
  onScopeChange,
  onSend,
}: {
  variant: "hero" | "docked";
  sending: boolean;
  incidents: Incident[];
  /** Selected incident id, or GENERAL_THREAD for general mode. */
  scopeId: string;
  onScopeChange: (id: string) => void;
  onSend: (content: string, attachments: AssistantAttachment[]) => void;
}) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [parsingCount, setParsingCount] = useState(0);

  const canSend =
    !sending && parsingCount === 0 && (value.trim().length > 0 || attachments.length > 0);

  function submit() {
    if (!canSend) return;
    const content = value.trim();
    const attached = attachments;
    setValue("");
    setAttachments([]);
    onSend(content, attached);
  }

  function handleFiles(selected: File[]) {
    selected.forEach((file) => {
      setParsingCount((n) => n + 1);
      parseUploadedFile(file)
        .then((contentText) => {
          setAttachments((prev) => [...prev, { fileName: file.name, contentText }]);
        })
        .catch((err: unknown) => {
          toast.error(
            err instanceof FileParseError
              ? err.message
              : t("extraction.toast.readError", { fileName: file.name })
          );
        })
        .finally(() => setParsingCount((n) => n - 1));
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-150 focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring/30",
        variant === "hero" ? "w-full" : "w-full"
      )}
    >
      {(attachments.length > 0 || parsingCount > 0) && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {attachments.map((att) => (
            <span
              key={att.fileName + att.contentText.length}
              className="inline-flex max-w-60 items-center gap-1.5 rounded-md border border-border bg-muted/50 py-1 pr-1 pl-2 text-xs"
            >
              <HugeiconsIcon
                icon={DocumentAttachmentIcon}
                size={12}
                strokeWidth={1.8}
                className="shrink-0 text-muted-foreground"
              />
              <span className="truncate">{att.fileName}</span>
              <button
                type="button"
                aria-label={t("assistant.attachRemove", { name: att.fileName })}
                onClick={() =>
                  setAttachments((prev) => prev.filter((a) => a !== att))
                }
                className="rounded-sm p-0.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={1.8} />
              </button>
            </span>
          ))}
          {parsingCount > 0 && (
            <span className="inline-flex items-center rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
              {t("assistant.attachParsing")}
            </span>
          )}
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        rows={variant === "hero" ? 2 : 1}
        placeholder={t(
          scopeId === GENERAL_THREAD
            ? "assistant.composerPlaceholderGeneral"
            : "assistant.composerPlaceholder"
        )}
        aria-label={t("assistant.composerLabel")}
        className={cn(
          "resize-none border-0 bg-transparent px-4 pt-3.5 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent",
          variant === "hero" ? "max-h-48 min-h-16" : "max-h-36 min-h-11"
        )}
      />

      <div className="flex items-center gap-1 px-2.5 pb-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("assistant.attach")}
          onClick={() => fileInputRef.current?.click()}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={1.8} />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            if (selected.length > 0) handleFiles(selected);
            e.target.value = "";
          }}
        />
        <div className="ml-auto flex items-center gap-1.5">
          <Select value={scopeId} onValueChange={onScopeChange}>
            <SelectTrigger
              size="sm"
              aria-label={t("assistant.selectIncident")}
              className="h-8 max-w-48 border-transparent bg-transparent text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={GENERAL_THREAD}>{t("assistant.general")}</SelectItem>
              {incidents.map((inc) => (
                <SelectItem key={inc.id} value={inc.id}>
                  {inc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            className="size-8 rounded-full"
            aria-label={t("assistant.sendLabel")}
            disabled={!canSend}
            onClick={submit}
          >
            <HugeiconsIcon icon={SentIcon} size={15} strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </div>
  );
}
