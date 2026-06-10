"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";

/**
 * Message composer: autosizing textarea (1 to ~4 rows), Enter sends,
 * Shift+Enter inserts a newline. Disabled until an incident is selected.
 */
export function Composer({
  disabled,
  sending,
  onSend,
}: {
  disabled: boolean;
  sending: boolean;
  onSend: (content: string) => void;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  const canSend = !disabled && !sending && value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    const content = value.trim();
    setValue("");
    onSend(content);
  }

  return (
    <div className="border-t px-6 py-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={t("assistant.composerPlaceholder")}
          aria-label={t("assistant.composerLabel")}
          disabled={disabled}
          className="max-h-28 min-h-9 flex-1 text-sm md:text-sm"
        />
        <Button
          size="icon"
          className="size-9"
          aria-label={t("assistant.sendLabel")}
          disabled={!canSend}
          onClick={submit}
        >
          <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  );
}
