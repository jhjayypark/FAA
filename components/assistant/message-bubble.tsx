"use client";

import type { ChatMessage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A single chat bubble: user right-aligned, assistant left-aligned. */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {isUser ? (
        <div className="max-w-[80%] rounded-lg bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
          {message.content}
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
  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[85%] rounded-lg border bg-card px-4 py-3">
        <span className="animate-pulse text-xs text-muted-foreground">
          Analyzing incident materials...
        </span>
      </div>
    </div>
  );
}
