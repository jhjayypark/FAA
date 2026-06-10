"use client";

import type { ChatMessage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** A single chat bubble: user right-aligned, assistant left-aligned. */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {isUser ? (
        <div className="flex max-w-[80%] flex-col items-end gap-1">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {message.attachments.map((name) => (
                <span
                  key={name}
                  className="max-w-52 truncate rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          {message.content && (
            <div className="rounded-lg bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
              {message.content}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[85%] rounded-lg border bg-card px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      )}
      <span className="font-mono text-[10px] text-muted-foreground">
        {formatDateTime(message.createdAt)}
      </span>
    </div>
  );
}

/** Left-aligned pending bubble shown while a reply is being computed. */
export function ThinkingBubble() {
  const t = useT();
  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[85%] rounded-lg border bg-card px-4 py-3">
        <span className="animate-pulse text-xs text-muted-foreground">
          {t("assistant.thinking")}
        </span>
      </div>
    </div>
  );
}
