"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  FNSLocation,
  Incident,
  InterviewSession,
  OverviewEntry,
  QAItem,
} from "@/lib/types";
import { FNS_LOCATIONS } from "@/lib/locations";
import { newId, nowIso } from "@/lib/format";

type AddIncidentInput = {
  name: string;
  context?: string;
  involvedLocationIds: string[];
};

export type InterfaceLanguage = "en" | "ko";

export type AppSettings = {
  /** UI labels language. Extracted/AI content stays Korean regardless. */
  language: InterfaceLanguage;
  displayName: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  displayName: "Jay Park",
};

type FAAState = {
  incidents: Incident[];
  customLocations: FNSLocation[];
  /** Assistant chat history, keyed by incident id. */
  assistantThreads: Record<string, ChatMessage[]>;
  settings: AppSettings;
  setLanguage: (language: InterfaceLanguage) => void;
  setDisplayName: (displayName: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Incidents
  addIncident: (input: AddIncidentInput) => Incident;
  updateIncident: (
    id: string,
    patch: Partial<Pick<Incident, "name" | "context" | "involvedLocationIds">>
  ) => void;
  deleteIncident: (id: string) => void;

  // Overview entries
  addOverviewEntry: (incidentId: string, entry: Omit<OverviewEntry, "id" | "createdAt">) => void;
  updateOverviewEntry: (
    incidentId: string,
    entryId: string,
    patch: Partial<Omit<OverviewEntry, "id" | "createdAt">>
  ) => void;
  deleteOverviewEntry: (incidentId: string, entryId: string) => void;

  // Locations
  addCustomLocation: (loc: Omit<FNSLocation, "id" | "isCustom">) => FNSLocation;

  // Interview sessions
  addInterviewSession: (
    incidentId: string,
    session: Omit<InterviewSession, "id" | "incidentId" | "createdAt">
  ) => InterviewSession;
  updateInterviewSession: (
    incidentId: string,
    sessionId: string,
    patch: Partial<Omit<InterviewSession, "id" | "incidentId" | "createdAt">>
  ) => void;
  deleteInterviewSession: (incidentId: string, sessionId: string) => void;

  // Q&A items
  updateQAItem: (
    incidentId: string,
    sessionId: string,
    qaId: string,
    patch: Partial<Omit<QAItem, "id">>
  ) => void;

  // Assistant
  addAssistantMessage: (incidentId: string, message: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearAssistantThread: (incidentId: string) => void;
};

function touch(incident: Incident): Incident {
  return { ...incident, updatedAt: nowIso() };
}

export const useFAAStore = create<FAAState>()(
  persist(
    (set, get) => ({
      incidents: [],
      customLocations: [],
      assistantThreads: {},
      settings: DEFAULT_SETTINGS,
      setLanguage: (language) =>
        set((s) => ({ settings: { ...s.settings, language } })),
      setDisplayName: (displayName) =>
        set((s) => ({ settings: { ...s.settings, displayName } })),
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addIncident: (input) => {
        const ts = nowIso();
        const incident: Incident = {
          id: newId(),
          name: input.name,
          context: input.context,
          involvedLocationIds: input.involvedLocationIds,
          createdAt: ts,
          updatedAt: ts,
          overviewEntries: [],
          interviewSessions: [],
        };
        set((s) => ({ incidents: [incident, ...s.incidents] }));
        return incident;
      },

      updateIncident: (id, patch) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === id ? touch({ ...inc, ...patch }) : inc
          ),
        })),

      deleteIncident: (id) =>
        set((s) => {
          const threads = { ...s.assistantThreads };
          delete threads[id];
          return {
            incidents: s.incidents.filter((inc) => inc.id !== id),
            assistantThreads: threads,
          };
        }),

      addOverviewEntry: (incidentId, entry) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  overviewEntries: [
                    ...inc.overviewEntries,
                    { ...entry, id: newId(), createdAt: nowIso() },
                  ],
                })
              : inc
          ),
        })),

      updateOverviewEntry: (incidentId, entryId, patch) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  overviewEntries: inc.overviewEntries.map((e) =>
                    e.id === entryId ? { ...e, ...patch } : e
                  ),
                })
              : inc
          ),
        })),

      deleteOverviewEntry: (incidentId, entryId) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  overviewEntries: inc.overviewEntries.filter((e) => e.id !== entryId),
                })
              : inc
          ),
        })),

      addCustomLocation: (loc) => {
        const location: FNSLocation = { ...loc, id: `custom-${newId()}`, isCustom: true };
        set((s) => ({ customLocations: [...s.customLocations, location] }));
        return location;
      },

      addInterviewSession: (incidentId, session) => {
        const created: InterviewSession = {
          ...session,
          id: newId(),
          incidentId,
          createdAt: nowIso(),
        };
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({ ...inc, interviewSessions: [...inc.interviewSessions, created] })
              : inc
          ),
        }));
        return created;
      },

      updateInterviewSession: (incidentId, sessionId, patch) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  interviewSessions: inc.interviewSessions.map((sess) =>
                    sess.id === sessionId ? { ...sess, ...patch } : sess
                  ),
                })
              : inc
          ),
        })),

      deleteInterviewSession: (incidentId, sessionId) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  interviewSessions: inc.interviewSessions.filter((sess) => sess.id !== sessionId),
                })
              : inc
          ),
        })),

      updateQAItem: (incidentId, sessionId, qaId, patch) =>
        set((s) => ({
          incidents: s.incidents.map((inc) =>
            inc.id === incidentId
              ? touch({
                  ...inc,
                  interviewSessions: inc.interviewSessions.map((sess) =>
                    sess.id === sessionId
                      ? {
                          ...sess,
                          qaItems: sess.qaItems.map((qa) =>
                            qa.id === qaId ? { ...qa, ...patch } : qa
                          ),
                        }
                      : sess
                  ),
                })
              : inc
          ),
        })),

      addAssistantMessage: (incidentId, message) =>
        set((s) => ({
          assistantThreads: {
            ...s.assistantThreads,
            [incidentId]: [
              ...(s.assistantThreads[incidentId] ?? []),
              { ...message, id: newId(), createdAt: nowIso() },
            ],
          },
        })),

      clearAssistantThread: (incidentId) =>
        set((s) => {
          const threads = { ...s.assistantThreads };
          delete threads[incidentId];
          return { assistantThreads: threads };
        }),
    }),
    {
      name: "faa-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        incidents: s.incidents,
        customLocations: s.customLocations,
        assistantThreads: s.assistantThreads,
        settings: s.settings,
      }),
      // Older persisted states predate `settings`; backfill missing fields.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FAAState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** All selectable locations: seed list plus user-added custom locations. */
export function useAllLocations(): FNSLocation[] {
  const custom = useFAAStore((s) => s.customLocations);
  return [...FNS_LOCATIONS, ...custom];
}

export function useIncident(id: string | undefined): Incident | undefined {
  return useFAAStore((s) => s.incidents.find((inc) => inc.id === id));
}

/**
 * True once the persisted state has been read back from localStorage.
 * Render skeletons until hydrated to avoid SSR/client mismatches.
 */
export function useHydrated(): boolean {
  return useFAAStore((s) => s._hasHydrated);
}

export function locationById(all: FNSLocation[], id: string): FNSLocation | undefined {
  return all.find((l) => l.id === id);
}
