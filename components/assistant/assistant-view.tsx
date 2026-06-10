"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { GENERAL_THREAD } from "@/lib/types";
import { useAllLocations, useFAAStore, useHydrated } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { answerQuestion, type AssistantAttachment } from "@/lib/assistant/answer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AssistantSkeleton } from "@/components/assistant/assistant-skeleton";
import { MessageBubble, ThinkingBubble } from "@/components/assistant/message-bubble";
import { SuggestedPrompts } from "@/components/assistant/suggested-prompts";
import { Composer } from "@/components/assistant/composer";
import { PenguinAvatar } from "@/components/penguin-avatar";

/**
 * Assistant chat. General mode (workspace-wide, no incident) by default;
 * selecting an incident in the composer scopes answers to its materials.
 * Uses useSearchParams, so the page wraps this in a <Suspense> boundary.
 */
export function AssistantView() {
  const t = useT();
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const incidents = useFAAStore((s) => s.incidents);
  const threads = useFAAStore((s) => s.assistantThreads);
  const displayName = useFAAStore((s) => s.settings.displayName);
  const locations = useAllLocations();
  const addAssistantMessage = useFAAStore((s) => s.addAssistantMessage);
  const clearAssistantThread = useFAAStore((s) => s.clearAssistantThread);

  // User selection wins; until the user picks, a valid ?incident= query
  // param preselects the incident (derived, so no effect is needed).
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  // Thread key a reply is currently being computed for, or null when idle.
  const [pendingId, setPendingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const paramId = searchParams.get("incident");
  const scopeId =
    userSelectedId ??
    (paramId && incidents.some((inc) => inc.id === paramId)
      ? paramId
      : GENERAL_THREAD);

  const general = scopeId === GENERAL_THREAD;
  const selectedIncident = general
    ? null
    : (incidents.find((inc) => inc.id === scopeId) ?? null);
  const threadKey = general ? GENERAL_THREAD : (selectedIncident?.id ?? GENERAL_THREAD);
  const messages = threads[threadKey] ?? [];
  const thinking = pendingId !== null;
  const threadThinking = pendingId === threadKey;
  const emptyThread = messages.length === 0 && !threadThinking;

  // Keep the thread pinned to the bottom on new messages and pending state.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, threadThinking, threadKey]);

  async function handleSend(content: string, attachments: AssistantAttachment[]) {
    if (thinking) return;
    const key = threadKey;
    const incident = general
      ? null
      : (useFAAStore.getState().incidents.find((inc) => inc.id === key) ?? null);
    if (!general && !incident) return;

    addAssistantMessage(key, {
      role: "user",
      content,
      attachments:
        attachments.length > 0 ? attachments.map((a) => a.fileName) : undefined,
    });
    // Capture the id of the user message just appended so the reply can be
    // dropped if the thread is cleared (or the incident deleted) meanwhile.
    const thread = useFAAStore.getState().assistantThreads[key] ?? [];
    const userMessageId = thread[thread.length - 1]?.id;
    setPendingId(key);
    try {
      const reply = await answerQuestion({
        incident,
        question: content,
        locations,
        allIncidents: useFAAStore.getState().incidents,
        attachments,
      });
      const state = useFAAStore.getState();
      const scopeStillValid =
        key === GENERAL_THREAD || state.incidents.some((inc) => inc.id === key);
      const messageStillInThread = (state.assistantThreads[key] ?? []).some(
        (m) => m.id === userMessageId
      );
      if (scopeStillValid && messageStillInThread) {
        addAssistantMessage(key, { role: "assistant", content: reply });
      }
    } catch {
      toast.error(t("assistant.replyError"));
    } finally {
      setPendingId(null);
    }
  }

  function handleClear() {
    clearAssistantThread(threadKey);
    toast.success(t("assistant.clearedToast"));
  }

  if (!hydrated) return <AssistantSkeleton />;

  const scopeLabel = selectedIncident?.name ?? t("assistant.generalLabel");

  const composer = (
    <Composer
      variant={emptyThread ? "hero" : "docked"}
      sending={thinking}
      incidents={incidents}
      scopeId={scopeId}
      onScopeChange={setUserSelectedId}
      onSend={handleSend}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b px-6">
        <h1 className="text-sm font-semibold">{t("assistant.title")}</h1>
        {messages.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
                {t("assistant.clear")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("assistant.clear")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("assistant.clearDescription", { name: scopeLabel })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleClear}>
                  {t("assistant.clearAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {emptyThread ? (
        /* Hero: greeting + centered prompt card, Claude-style. */
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <PenguinAvatar className="size-10" />
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("assistant.greeting", { name: displayName })}
              </h2>
            </div>
            {composer}
            <p className="text-center text-xs text-muted-foreground">
              {general ? t("assistant.generalHint") : t("assistant.grounding")}
            </p>
            <SuggestedPrompts
              mode={general ? "general" : "incident"}
              onSelect={(q) => handleSend(q, [])}
              disabled={thinking}
            />
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {threadThinking && <ThinkingBubble />}
            </div>
          </div>
          <div className="px-6 pb-4">
            <div className="mx-auto w-full max-w-3xl">{composer}</div>
          </div>
        </>
      )}
    </div>
  );
}
