"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useAllLocations, useFAAStore, useHydrated } from "@/lib/store";
import { answerQuestion } from "@/lib/assistant/answer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/**
 * Incident-scoped assistant chat. Uses useSearchParams, so the page wraps
 * this component in a <Suspense> boundary.
 */
export function AssistantView() {
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const incidents = useFAAStore((s) => s.incidents);
  const threads = useFAAStore((s) => s.assistantThreads);
  const locations = useAllLocations();
  const addAssistantMessage = useFAAStore((s) => s.addAssistantMessage);
  const clearAssistantThread = useFAAStore((s) => s.clearAssistantThread);

  // User selection wins; until the user picks, a valid ?incident= query
  // param preselects the incident (derived, so no effect is needed).
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  // Incident id a reply is currently being computed for, or null when idle.
  const [pendingId, setPendingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const paramId = searchParams.get("incident");
  const incidentId =
    userSelectedId ?? (paramId && incidents.some((inc) => inc.id === paramId) ? paramId : "");

  const selectedIncident = incidents.find((inc) => inc.id === incidentId);
  const messages = selectedIncident ? (threads[selectedIncident.id] ?? []) : [];
  const thinking = pendingId !== null;
  const threadThinking = pendingId !== null && pendingId === selectedIncident?.id;

  // Keep the thread pinned to the bottom on new messages and pending state.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, threadThinking, incidentId]);

  async function handleSend(content: string) {
    const id = incidentId;
    const incident = useFAAStore.getState().incidents.find((inc) => inc.id === id);
    if (!incident || thinking) return;
    addAssistantMessage(id, { role: "user", content });
    // Capture the id of the user message just appended so the reply can be
    // dropped if the thread is cleared (or the incident deleted) meanwhile.
    const thread = useFAAStore.getState().assistantThreads[id] ?? [];
    const userMessageId = thread[thread.length - 1]?.id;
    setPendingId(id);
    try {
      const reply = await answerQuestion({ incident, question: content, locations });
      const state = useFAAStore.getState();
      const incidentExists = state.incidents.some((inc) => inc.id === id);
      const messageStillInThread = (state.assistantThreads[id] ?? []).some(
        (m) => m.id === userMessageId
      );
      if (incidentExists && messageStillInThread) {
        addAssistantMessage(id, { role: "assistant", content: reply });
      }
    } catch {
      toast.error("Could not generate a reply. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handleClear() {
    if (!selectedIncident) return;
    clearAssistantThread(selectedIncident.id);
    toast.success("Conversation cleared.");
  }

  if (!hydrated) return <AssistantSkeleton />;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex flex-col gap-2 border-b px-6 py-3 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center justify-between gap-3 md:contents">
          <h1 className="shrink-0 text-sm font-semibold">Assistant</h1>
          <div className="md:order-last md:ml-auto">
            {selectedIncident && messages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
                    Clear conversation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`This removes all messages for "${selectedIncident.name}". This action cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleClear}>
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <Select
          value={incidentId}
          onValueChange={setUserSelectedId}
          disabled={incidents.length === 0}
        >
          <SelectTrigger className="w-full md:w-72" aria-label="Select incident">
            <SelectValue placeholder="Select incident" />
          </SelectTrigger>
          <SelectContent>
            {incidents.map((inc) => (
              <SelectItem key={inc.id} value={inc.id}>
                {inc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Thread area */}
      {!selectedIncident ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <HugeiconsIcon
              icon={BubbleChatIcon}
              size={28}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
            {incidents.length === 0 ? (
              <>
                <div className="text-sm font-semibold">No incidents yet</div>
                <p className="text-sm text-muted-foreground">
                  Create an incident first, then ask questions grounded in its audit
                  materials.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/incidents">Go to Incidents</Link>
                </Button>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">No incident selected</div>
                <p className="text-sm text-muted-foreground">
                  Select an incident to ask questions based on its audit context.
                </p>
              </>
            )}
          </div>
        </div>
      ) : messages.length === 0 && !threadThinking ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
            <HugeiconsIcon
              icon={BubbleChatIcon}
              size={28}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              {
                "Answers are grounded in this incident's interviews, notes, and findings. The assistant replies in Korean."
              }
            </p>
            <SuggestedPrompts onSelect={handleSend} disabled={thinking} />
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {threadThinking && <ThinkingBubble />}
          </div>
        </div>
      )}

      {/* Composer */}
      <Composer disabled={!selectedIncident} sending={thinking} onSend={handleSend} />
    </div>
  );
}
