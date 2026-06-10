import type {
  ExtractionSettings,
  Incident,
  OverviewEntry,
  UploadedInterviewFile,
} from "@/lib/types";
import { FNS_LOCATIONS } from "@/lib/locations";

/**
 * System prompt for interview Q&A extraction.
 * These rules are hard constraints; the model must treat them as non-negotiable.
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are FAA, FNS Audit Assistant. You extract factual Korean Q&A pairs from internal audit interview materials.

The source materials may include Korean interview transcripts, manual shorthand notes, or both.

ABSOLUTE RULES:
1. 없는 말 절대 추가 금지.
2. 추정 금지.
3. 녹취/노트에 없는 내용은 쓰지 않는다.
4. 애매하면 "모름"이라고 쓰거나 해당 항목을 제외한다.
5. 사실 위주로 작성한다.
6. 인터뷰어 질문이 다양한 형태로 적혀 있어도 모두 "Q:" 형식의 명확한 질문으로 통일한다.
7. 답변은 반드시 source material에서 확인 가능한 내용만 사용한다.
8. 모든 Q&A에는 반드시 source citation을 붙인다.
9. citation quote는 실제 원문에서 그대로 발췌한 짧은 구절이어야 한다.
10. 원문 근거가 없으면 Q&A를 생성하지 않는다.
11. 한국어 인터뷰이므로 output은 한국어로 작성한다.
12. UI labels are English, but extracted content must be Korean.

TASK:
Given the incident context, involved locations, overview notes, transcript files, and manual notes, extract interview Q&A pairs.

QUESTION NORMALIZATION:
- Convert interviewer prompts into concise Korean questions.
- Always start each question semantically as a question, but do not invent a new meaning.
- If the original question is fragmented, clean it only enough to be readable.
- Do not add new facts.

ANSWER EXTRACTION:
- Answers must be factual.
- Do not summarize beyond what the interviewee actually said.
- If the answer is unclear, write "모름" or exclude it.
- If transcript and notes conflict, mention the conflict and cite both.

IMPORTANCE:
Assign importance:
- High: directly relevant to the incident, responsibility, timeline, policy violation, contradiction, risk, financial/logistics impact, or key decision.
- Medium: relevant context but not central.
- Low: background or minor clarification.

If the user selected "important only", return only High and clearly relevant Medium items.
If not selected, return all Q&A items and mark each with importance.

OUTPUT:
Return only valid JSON with:
{
  "intervieweeName": string | null,
  "qaItems": [
    {
      "question": string,
      "answer": string,
      "importance": "High" | "Medium" | "Low",
      "importanceReason": string,
      "includedInReport": boolean,
      "sourceCitations": [
        {
          "fileId": string,
          "fileName": string,
          "quote": string,
          "startChar": number | null,
          "endChar": number | null,
          "confidence": number
        }
      ]
    }
  ]
}`;

/** System prompt for the incident-scoped audit assistant. */
export const ASSISTANT_SYSTEM_PROMPT = `You are FAA, FNS Audit Assistant, helping an internal auditor understand a selected audit incident.

The UI is English, but your answer must be Korean by default.

Use only the selected incident context, overview notes, uploaded interview materials, extracted Q&A, and citations available in the app.

Do not invent facts.
Do not assume missing information.
If the answer cannot be verified from the incident materials, say:
"현재 업로드된 자료만으로는 확인할 수 없습니다."

When helpful, cite the relevant Q&A item or source file name.
Be concise, factual, and audit-oriented.`;

/** Standard reply when the incident materials cannot verify an answer. */
export const ASSISTANT_CANNOT_VERIFY = "현재 업로드된 자료만으로는 확인할 수 없습니다.";

function locationNames(incident: Incident, customNames: Record<string, string> = {}): string[] {
  return incident.involvedLocationIds.map((id) => {
    const seed = FNS_LOCATIONS.find((l) => l.id === id);
    return seed?.name ?? customNames[id] ?? id;
  });
}

function serializeOverview(entries: OverviewEntry[]): string {
  if (entries.length === 0) return "(none)";
  return entries
    .map((e) => {
      const parts = [`[${e.type}] ${e.title}`];
      if (e.dateTime) parts.push(`datetime: ${e.dateTime}`);
      if (e.people?.length) parts.push(`people: ${e.people.join(", ")}`);
      if (e.description) parts.push(e.description);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

/**
 * Builds the user-turn prompt for a real LLM extraction call.
 * Kept alongside the mock so swapping in a provider only changes the transport.
 */
export function buildExtractionUserPrompt(args: {
  incident: Incident;
  overviewEntries: OverviewEntry[];
  uploadedFiles: UploadedInterviewFile[];
  settings: ExtractionSettings;
}): string {
  const { incident, overviewEntries, uploadedFiles, settings } = args;
  const files = uploadedFiles
    .map(
      (f) =>
        `=== FILE id=${f.id} name=${f.fileName} sourceType=${f.sourceType} ===\n${f.contentText}`
    )
    .join("\n\n");

  return `INCIDENT: ${incident.name}
CONTEXT: ${incident.context || "(none)"}
INVOLVED LOCATIONS: ${locationNames(incident).join("; ") || "(none)"}
OVERVIEW NOTES:
${serializeOverview(overviewEntries)}

EXTRACTION SETTINGS:
- stylePreset: ${settings.stylePreset}
- importantOnly: ${settings.importantOnly}

SOURCE MATERIALS:
${files}`;
}

/** Serializes the full incident workspace into a context block for the assistant. */
export function buildAssistantContext(incident: Incident): string {
  const sessions = incident.interviewSessions
    .map((s) => {
      const qa = s.qaItems
        .map(
          (q, i) =>
            `  ${i + 1}. [${q.importance}]${q.includedInReport ? " [in report]" : ""} Q: ${q.question}\n     A: ${q.answer}\n     출처: ${q.sourceCitations.map((c) => c.fileName).join(", ") || "(없음)"}`
        )
        .join("\n");
      return `INTERVIEW SESSION: ${s.intervieweeName || "Unknown interviewee"} (${s.interviewDate || "date unknown"})\nFILES: ${s.uploadedFiles.map((f) => f.fileName).join(", ")}\nQ&A ITEMS:\n${qa || "  (none)"}`;
    })
    .join("\n\n");

  return `INCIDENT: ${incident.name}
CONTEXT: ${incident.context || "(none)"}
INVOLVED LOCATIONS: ${locationNames(incident).join("; ") || "(none)"}
OVERVIEW NOTES:
${serializeOverview(incident.overviewEntries)}

${sessions || "(no interview sessions yet)"}`;
}
