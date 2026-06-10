/**
 * Incident-scoped assistant answer engine.
 *
 * LLM-READY DESIGN
 * This module mirrors the transport shape of a real LLM call. The system
 * prompt (ASSISTANT_SYSTEM_PROMPT) and the serialized incident context
 * (buildAssistantContext) already exist in lib/prompts.ts, so swapping the
 * mock for a real provider only requires implementing the branch behind
 * llmConfigured(). Nothing in the UI layer changes.
 *
 * The mock engine is strictly extractive: it only restates data present in
 * the incident object (Q&A items, citations, overview entries, involved
 * locations) and never invents facts. When nothing in the materials supports
 * an answer, it returns ASSISTANT_CANNOT_VERIFY verbatim. All replies are
 * Korean, polite 합니다체, concise, and audit-oriented.
 */

import type {
  FNSLocation,
  Importance,
  Incident,
  OverviewEntry,
  OverviewEntryType,
  QAItem,
} from "@/lib/types";
import {
  ASSISTANT_CANNOT_VERIFY,
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantContext,
} from "@/lib/prompts";
import { FNS_LOCATIONS } from "@/lib/locations";
import { truncate } from "@/lib/format";

/**
 * Returns true once a real LLM provider is wired up.
 * TODO: Replace mock assistant with real LLM provider call using
 * ASSISTANT_SYSTEM_PROMPT + buildAssistantContext(incident, locations).
 */
function llmConfigured(): boolean {
  return false;
}

export type AssistantAttachment = { fileName: string; contentText: string };

export async function answerQuestion({
  incident,
  question,
  locations = FNS_LOCATIONS,
  allIncidents = [],
  attachments = [],
}: {
  /** null = general mode: answers from the whole workspace, no incident scope. */
  incident: Incident | null;
  question: string;
  /** Merged seed + custom location list (e.g. from useAllLocations()). */
  locations?: FNSLocation[];
  /** All incidents, used for cross-incident answers in general mode. */
  allIncidents?: Incident[];
  /** Files attached to this message; searched like uploaded material. */
  attachments?: AssistantAttachment[];
}): Promise<string> {
  // Simulated analysis latency; mirrors a real provider round trip.
  await delay(700 + Math.floor(Math.random() * 500));

  if (llmConfigured()) {
    // TODO: Replace mock assistant with real LLM provider call using
    // ASSISTANT_SYSTEM_PROMPT + buildAssistantContext(incident, locations);
    // in general mode (incident === null) concatenate contexts of
    // allIncidents and append attachment contents to the user turn.
    const systemPrompt = ASSISTANT_SYSTEM_PROMPT;
    const context = incident ? buildAssistantContext(incident, locations) : "";
    throw new Error(
      `LLM provider not configured (prepared ${systemPrompt.length + context.length} prompt chars).`
    );
  }

  return mockAnswer(incident, question.trim(), locations, allIncidents, attachments);
}

// ---------------------------------------------------------------------------
// Mock rule-based engine
// ---------------------------------------------------------------------------

type Intent =
  | "contradiction"
  | "followup"
  | "report"
  | "importance"
  | "location"
  | "timeline"
  | "incidents"
  | "search";

/** A Q&A item annotated with its session interviewee and citation files. */
type QARef = {
  qa: QAItem;
  interviewee: string;
  fileNames: string[];
  /** Set in general mode so replies say which incident a quote comes from. */
  incidentName?: string;
};

const IMPORTANCE_ORDER: Record<Importance, number> = { High: 0, Medium: 1, Low: 2 };

const ENTRY_TYPE_KO: Record<OverviewEntryType, string> = {
  interview: "인터뷰",
  person: "인물",
  note: "메모",
  timeline: "타임라인",
};

const NEGATION = /없|아니|않|모름|불가/;
const UNCERTAIN = /모름|기억나|확인 필요|애매/;

function mockAnswer(
  incident: Incident | null,
  question: string,
  locations: FNSLocation[],
  allIncidents: Incident[],
  attachments: AssistantAttachment[]
): string {
  const general = incident === null;
  const scope = general ? allIncidents : [incident];
  const intent = detectIntent(question);
  const refs = collectQA(scope, general);
  const hasMaterial =
    attachments.length > 0 ||
    scope.some(
      (i) => i.interviewSessions.length > 0 || i.overviewEntries.length > 0
    );

  if (general && intent === "incidents") return answerIncidentsOverview(allIncidents);

  // Involved locations live on the incident record itself, so the location
  // intent stays answerable even before any interview or overview material.
  if (intent === "location") {
    if (!general) return answerLocations(incident, locations);
    const lines = allIncidents
      .filter((i) => i.involvedLocationIds.length > 0)
      .slice(0, 6)
      .map((i) => {
        const names = i.involvedLocationIds
          .map((id) => locations.find((l) => l.id === id)?.name ?? id)
          .join(", ");
        return `- ${i.name}: ${names}`;
      });
    if (lines.length === 0) return "등록된 관련 장소가 있는 인시던트가 없습니다.";
    return ["인시던트별 관련 장소는 다음과 같습니다.", ...lines].join("\n");
  }

  // No sessions, overview data, or attachments at all: nothing to verify.
  if (!hasMaterial) return ASSISTANT_CANNOT_VERIFY;

  const overviewEntries = scope.flatMap((i) => i.overviewEntries);

  switch (intent) {
    case "contradiction":
      return answerContradiction(refs);
    case "followup":
      return answerFollowUp(refs, overviewEntries);
    case "report":
      return answerReport(refs);
    case "importance":
      return answerImportance(refs);
    case "timeline":
      return answerTimelineEntries(overviewEntries);
    default:
      return answerKeywordSearch(refs, question, attachments);
  }
}

/** General mode: workspace overview of all incidents. */
function answerIncidentsOverview(incidents: Incident[]): string {
  if (incidents.length === 0) {
    return "등록된 인시던트가 없습니다. 먼저 인시던트를 생성해 주세요.";
  }
  const lines = incidents.slice(0, 10).map((i, idx) => {
    const qaCount = i.interviewSessions.reduce((n, s) => n + s.qaItems.length, 0);
    return `${idx + 1}. ${i.name} : 인터뷰 세션 ${i.interviewSessions.length}건, Q&A ${qaCount}건`;
  });
  return [`현재 등록된 인시던트는 ${incidents.length}건입니다.`, ...lines].join("\n");
}

/**
 * Intent order matters: report keywords (PPT, finding, 정리) are checked
 * before importance keywords (핵심, 중요) so a prompt like
 * "PPT에 넣을 핵심 finding만 정리해줘" routes to the report intent.
 */
function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/모순|불일치|충돌|conflict/.test(q)) return "contradiction";
  if (/추가\s*인터뷰|질문.*추천|추천.*질문|더\s*물어/.test(q)) return "followup";
  if (/ppt|finding|정리|요약/.test(q)) return "report";
  if (/중요|쟁점|핵심|important/.test(q)) return "importance";
  if (/장소|위치|어디/.test(q)) return "location";
  if (/언제|날짜|타임라인/.test(q)) return "timeline";
  if (/(인시던트|사건).*(목록|현황|몇 ?건|어떤 게|뭐가 있)/.test(q)) return "incidents";
  return "search";
}

function collectQA(incidents: Incident[], labelIncident: boolean): QARef[] {
  return incidents.flatMap((incident) =>
    incident.interviewSessions.flatMap((session) =>
      session.qaItems.map((qa) => ({
        qa,
        interviewee: session.intervieweeName || "미상",
        fileNames: [...new Set(qa.sourceCitations.map((c) => c.fileName))],
        incidentName: labelIncident ? incident.name : undefined,
      }))
    )
  );
}

function fileLabel(ref: QARef): string {
  const files = ref.fileNames.join(", ") || "없음";
  return ref.incidentName ? `${files} / ${ref.incidentName}` : files;
}

// --- Intent: importance ----------------------------------------------------

function answerImportance(refs: QARef[]): string {
  if (refs.length === 0) return ASSISTANT_CANNOT_VERIFY;
  const high = refs.filter((r) => r.qa.importance === "High").slice(0, 5);
  if (high.length === 0) {
    const medium = refs.filter((r) => r.qa.importance === "Medium").length;
    const low = refs.filter((r) => r.qa.importance === "Low").length;
    return `현재 추출된 Q&A 중 중요도 High로 분류된 쟁점은 없습니다. Medium ${medium}건, Low ${low}건이 기록되어 있습니다.`;
  }
  const lines = high.map(
    (r, i) =>
      `${i + 1}. ${r.qa.question} : ${truncate(r.qa.answer, 100)} (출처: ${fileLabel(r)}, 면담: ${r.interviewee})`
  );
  return ["현재 자료 기준으로 중요도가 높은 쟁점은 다음과 같습니다.", ...lines].join("\n");
}

// --- Intent: contradiction -------------------------------------------------

/**
 * Naive contradiction scan: pairs of answers that share at least 2
 * significant tokens, where exactly one side contains a negation marker.
 * This is a heuristic, so the reply is explicitly hedged.
 */
function answerContradiction(refs: QARef[]): string {
  if (refs.length === 0) {
    return "현재 추출된 Q&A가 없어 모순 여부를 검토할 수 없습니다.";
  }
  const tokenSets = refs.map((r) => new Set(significantTokens(r.qa.answer)));
  const pairs: Array<[QARef, QARef]> = [];
  for (let i = 0; i < refs.length && pairs.length < 2; i++) {
    for (let j = i + 1; j < refs.length && pairs.length < 2; j++) {
      let shared = 0;
      for (const t of tokenSets[i]) {
        if (tokenSets[j].has(t)) shared++;
      }
      if (shared < 2) continue;
      const negI = NEGATION.test(refs[i].qa.answer);
      const negJ = NEGATION.test(refs[j].qa.answer);
      if (negI !== negJ) pairs.push([refs[i], refs[j]]);
    }
  }
  if (pairs.length === 0) {
    return "현재 추출된 Q&A 기준으로 명백히 모순되는 답변 쌍은 확인되지 않습니다.";
  }
  const lines: string[] = ["단정할 수는 없으나, 아래 항목은 상호 확인이 필요합니다."];
  pairs.forEach(([a, b], idx) => {
    lines.push(`${idx + 1}. ${a.interviewee}: "${truncate(a.qa.answer, 80)}" (출처: ${fileLabel(a)})`);
    lines.push(`   ${b.interviewee}: "${truncate(b.qa.answer, 80)}" (출처: ${fileLabel(b)})`);
  });
  return lines.join("\n");
}

// --- Intent: report / findings ----------------------------------------------

function answerReport(refs: QARef[]): string {
  const included = refs.filter((r) => r.qa.includedInReport);
  if (included.length === 0) {
    return "현재 보고서에 포함된 Q&A 카드가 없습니다. 결과 화면에서 카드를 선택해 주세요.";
  }
  const sorted = [...included].sort(
    (a, b) => IMPORTANCE_ORDER[a.qa.importance] - IMPORTANCE_ORDER[b.qa.importance]
  );
  const shown = sorted.slice(0, 7);
  const lines = shown.map(
    (r, i) =>
      `${i + 1}. [${r.qa.importance}] ${r.qa.question} : ${truncate(r.qa.answer, 90)} (출처: ${fileLabel(r)})`
  );
  const result = ["보고서에 포함된 핵심 finding은 다음과 같습니다.", ...lines];
  if (sorted.length > shown.length) {
    result.push(`외 ${sorted.length - shown.length}건이 더 포함되어 있습니다.`);
  }
  return result.join("\n");
}

// --- Intent: follow-up questions ---------------------------------------------

/** Generic note-stub questions carry no topic of their own. */
const GENERIC_STUB_QUESTION = /^수기 노트에 기록된 사항은\?$/;

/**
 * Follow-ups are derived ONLY from existing material: uncertain answers,
 * low-confidence citations, and already scheduled future interviews.
 * No new topics are invented.
 */
function answerFollowUp(refs: QARef[], overviewEntries: OverviewEntry[]): string {
  const uncertain = refs
    .filter(
      (r) =>
        UNCERTAIN.test(r.qa.answer) ||
        r.qa.sourceCitations.some((c) => c.confidence < 0.7)
    )
    .slice(0, 4);
  const seen = new Set<string>();
  const items: string[] = [];
  for (const r of uncertain) {
    // Generic note stubs ("수기 노트에 기록된 사항은?") say nothing about the
    // topic, so surface the answer excerpt instead of the question.
    const stub = GENERIC_STUB_QUESTION.test(r.qa.question.trim());
    const topic = stub ? truncate(r.qa.answer, 60) : truncate(r.qa.question, 70);
    const reason = UNCERTAIN.test(r.qa.answer)
      ? stub
        ? "답변이 불확실하게 기록되어 있어 재확인이 필요합니다"
        : `답변이 다음과 같이 기록되어 있어 재확인이 필요합니다: "${truncate(r.qa.answer, 50)}"`
      : "출처 인용의 신뢰도가 낮아 재확인이 필요합니다";
    const line = `"${topic}" : ${reason}. (면담: ${r.interviewee})`;
    if (seen.has(line)) continue;
    seen.add(line);
    items.push(line);
  }
  const lines = items.map((line, i) => `${i + 1}. ${line}`);
  const now = Date.now();
  const upcoming = overviewEntries
    .filter(
      (e) => e.type === "interview" && e.dateTime && new Date(e.dateTime).getTime() > now
    )
    .slice(0, 2);
  for (const e of upcoming) {
    const people = e.people?.length ? `, 대상: ${e.people.join(", ")}` : "";
    lines.push(`예정된 인터뷰: ${e.title} (${formatStamp(e.dateTime!)})${people}`);
  }
  if (lines.length === 0) {
    return "현재 자료 기준으로 추가 확인이 필요하다고 표시된 항목은 발견되지 않았습니다.";
  }
  return ["다음 항목은 추가 확인이 필요해 보입니다.", ...lines].join("\n");
}

// --- Intent: locations --------------------------------------------------------

/**
 * Resolves ids against the caller-provided merged list (seed + custom
 * locations from the store), so custom locations print as name + address
 * instead of raw ids. Ids missing from the list fall back to a labeled id.
 */
function answerLocations(incident: Incident, locations: FNSLocation[]): string {
  if (incident.involvedLocationIds.length === 0) {
    return "이 사건에 등록된 관련 장소가 없습니다.";
  }
  const lines = incident.involvedLocationIds.slice(0, 8).map((id, i) => {
    const loc =
      locations.find((l) => l.id === id) ?? FNS_LOCATIONS.find((l) => l.id === id);
    return loc
      ? `${i + 1}. ${loc.name} (${loc.address})`
      : `${i + 1}. 미확인 장소 (id: ${id})`;
  });
  return ["이 사건에 등록된 관련 장소는 다음과 같습니다.", ...lines].join("\n");
}

// --- Intent: timeline ---------------------------------------------------------

function answerTimelineEntries(overviewEntries: OverviewEntry[]): string {
  const dated = overviewEntries
    .filter((e): e is OverviewEntry & { dateTime: string } => Boolean(e.dateTime))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 8);
  if (dated.length === 0) {
    return "현재 개요에 날짜가 기록된 항목이 없습니다.";
  }
  const lines = dated.map(
    (e, i) => `${i + 1}. ${formatStamp(e.dateTime)} : [${ENTRY_TYPE_KO[e.type]}] ${e.title}`
  );
  return ["현재 개요에 기록된 일정은 다음과 같습니다.", ...lines].join("\n");
}

// --- Fallback: keyword search ---------------------------------------------------

/** Line-level search over attached files; quotes matching lines verbatim. */
function searchAttachments(
  attachments: AssistantAttachment[],
  tokens: string[]
): string[] {
  const hits: { score: number; text: string }[] = [];
  for (const att of attachments) {
    for (const raw of att.contentText.split(/\r?\n/)) {
      const line = raw.trim();
      if (line.length < 6) continue;
      const lower = line.toLowerCase();
      const score = tokens.reduce((n, t) => n + (lower.includes(t) ? 1 : 0), 0);
      if (score > 0) {
        hits.push({ score, text: `"${truncate(line, 90)}" (첨부: ${att.fileName})` });
      }
    }
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((h) => h.text);
}

function answerKeywordSearch(
  refs: QARef[],
  question: string,
  attachments: AssistantAttachment[] = []
): string {
  const tokens = questionTokens(question);
  if (tokens.length === 0) return ASSISTANT_CANNOT_VERIFY;
  const attachmentLines = searchAttachments(attachments, tokens);
  if (refs.length === 0) {
    if (attachmentLines.length === 0) return ASSISTANT_CANNOT_VERIFY;
    return ["첨부 파일에서 관련된 내용을 찾았습니다.", ...attachmentLines].join("\n");
  }
  const scored = refs
    .map((r) => {
      const haystack = `${r.qa.question} ${r.qa.answer}`.toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (scored.length === 0) {
    if (attachmentLines.length === 0) return ASSISTANT_CANNOT_VERIFY;
    return ["첨부 파일에서 관련된 내용을 찾았습니다.", ...attachmentLines].join("\n");
  }
  const lines = scored.map(
    ({ r }, i) =>
      `${i + 1}. Q: ${truncate(r.qa.question, 60)} / A: ${truncate(r.qa.answer, 100)} (출처: ${fileLabel(r)}, 면담: ${r.interviewee})`
  );
  // If a substantial part of the question (half or more of its content
  // tokens) is not covered by any material (e.g. asking about salary when
  // only logistics records exist), say so before quoting what IS related, so
  // a partial match never reads as a direct answer. A small uncovered
  // remainder is treated as phrasing noise, not a missing topic.
  const attachmentText = attachments.map((a) => a.contentText).join(" ").toLowerCase();
  const allText =
    refs.map((r) => `${r.qa.question} ${r.qa.answer}`).join(" ").toLowerCase() +
    " " +
    attachmentText;
  const uncovered = tokens.filter((t) => !allText.includes(t));
  const extra = attachmentLines.length
    ? ["", "첨부 파일에서 찾은 내용:", ...attachmentLines]
    : [];
  if (uncovered.length / tokens.length > 0.5) {
    return [
      ASSISTANT_CANNOT_VERIFY,
      "다만 질문과 관련된 인터뷰 내용은 다음과 같습니다.",
      ...lines,
      ...extra,
    ].join("\n");
  }
  return ["관련된 인터뷰 내용은 다음과 같습니다.", ...lines, ...extra].join("\n");
}

// ---------------------------------------------------------------------------
// Tokenization helpers (naive, mock-only)
// ---------------------------------------------------------------------------

const HANGUL = /[가-힣]/;

/** Common trailing particles stripped from longer Hangul tokens. */
const TRAILING_PARTICLES =
  /(에서|에게|으로|이라|라고|까지|부터|은|는|이|가|을|를|에|의|와|과|도|만|로)$/;

const QUESTION_STOPWORDS = new Set([
  "이번",
  "사건",
  "관련",
  "관련된",
  "내용",
  "부분",
  "답변",
  "질문",
  "인터뷰",
  "있어",
  "있나요",
  "있습니까",
  "뭐야",
  "무엇",
  "어떤",
  "어떻게",
  "정리",
  "요약",
  "알려줘",
  "알려주세요",
  "해줘",
  "해주세요",
  "주세요",
  "대해",
  "대한",
  "서로",
  "가장",
  // Abstract qualifiers that describe the question, not its topic.
  "상태",
  "상황",
  "문제",
  "결과",
  "경우",
  // Colloquial question endings; never content tokens.
  "어땠어",
  "어땠나요",
  "어때",
  "됐어",
  "였어",
  "뭐였어",
  "누구야",
  "어디야",
  "얼마야",
  "왜",
  "the",
  "and",
  "about",
  "this",
  "what",
]);

const ANSWER_STOPWORDS = new Set([
  "있습니다",
  "없습니다",
  "합니다",
  "했습니다",
  "입니다",
  "않습니다",
  "됩니다",
  "같습니다",
  "그리고",
  "하지만",
  "그러나",
  "경우",
  "때문",
  "정도",
  "관련",
  "해당",
  "부분",
  "내용",
  "모름",
]);

/** Hangul tokens must be >= 2 chars; latin/numeric tokens >= 3 chars. */
function baseTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .filter(Boolean)
    .map((t) => (HANGUL.test(t) && t.length > 2 ? t.replace(TRAILING_PARTICLES, "") : t))
    .filter((t) => (HANGUL.test(t) ? t.length >= 2 : t.length >= 3));
}

function questionTokens(question: string): string[] {
  return [...new Set(baseTokens(question).filter((t) => !QUESTION_STOPWORDS.has(t)))];
}

function significantTokens(answer: string): string[] {
  return [...new Set(baseTokens(answer).filter((t) => !ANSWER_STOPWORDS.has(t)))];
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/** Locale-neutral date stamp for Korean reply lines; date-only values pass through. */
function formatStamp(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
