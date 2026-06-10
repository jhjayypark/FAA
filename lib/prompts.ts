import type {
  ExtractionSettings,
  FNSLocation,
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
- Rewrite each interviewer prompt as ONE concise, formal Korean sentence in 합쇼체 ("~습니까?", "~에 대해 설명 부탁드립니다").
- Drop greetings, fillers, repetition, and meta-talk; keep only the core question.
- If the interviewer rambles through multiple variants of the same question, collapse them into the single core question. An either/or question ("A입니까, 아니면 B입니까?") is acceptable.
- If the original question is fragmented, normalize it into a complete question without inventing a new meaning.
- Do not add new facts.

ANSWER EXTRACTION:
- Answers must be factual.
- CONDENSE each answer to only the essential facts: strongly prefer 1 line; hard maximum 2-3 lines (about 150 Korean characters).
- Use formal endings ("~했습니다", "~입니다"). Strip fillers, repetition, and tangents.
- Condensing is rephrasing and selecting, never inventing: you may rephrase and shorten what the interviewee said, but every fact in the answer must be present in the source. Do not add any fact not in the source.
- ALWAYS preserve concrete facts: 이름, 날짜, 금액, 회사/법인명, 수량.
- Preserve meaning-bearing hedges and refusals ("잘 모르겠습니다", "~인 것 같습니다", 답변 거부 등) — do not strip them.
- Do not prefix answers with the speaker's name; the app already shows the interviewee per session.
- Condensing applies to question/answer text only — sourceCitations quotes must remain verbatim excerpts from the source.
- If the answer is unclear, write "모름" or exclude it.
- If transcript and notes conflict, mention the conflict and cite both.
- If the source shows an interview timestamp such as (10:05) next to an exchange, copy it verbatim into timestampLabel; otherwise use null.

STYLE EXAMPLES (style references only — they define TONE and LENGTH, not content; never copy their facts into output):

Transformation example (verbose transcript → target style):
원문 질문: "네 다이렉트로 얘기하세요? 아니면 최종호 팀장님이 그 대신 이렇게 얘기해 주시는 그런 형태예요? 최종호 팀장을 통해서 얘기를 하는지 아니면 그냥 이행란 실장님이랑 다이렉트로 소통하시는지?"
→ Q: "보고는 최종호 팀장을 통해 하십니까, 아니면 실장님과 직접 소통하십니까?"
원문 답변: "그거는 그때그때 다른 것 같아요 보고를 해야 되고 보고 체계가 올라가는 건 최종호 팀장님이 통해서 얘기를 하고요 그거 외에 이제 실장님이 별도로 물어보거나, 실장님만 관여되어 있는 거는 실장님한테 직접 얘기하기도 하죠 복합적이네요"
→ A: "사안에 따라 다릅니다. 보고 체계상 보고는 최종호 팀장을 통해 하고, 실장님만 관여된 사안은 실장님께 직접 얘기합니다."

Target-style Q&A pairs:
Q: "운송사 설립/운영에 대해서 MGNT에 보고한 적이 있습니까?"
A: "규모가 작고 단순 운영 구조라 별도로 보고하지 않았습니다."

Q: "차량 소유 및 운영 구조는 어떻게 됩니까?"
A: "초기에 자가 차량 2대로 시작하였고 이후 최대 8대까지 투입하였습니다. 차량은 모두 본인 소유이며 Fleet Owner와 Driver가 수익을 50:50으로 배분하는 구조입니다."

Q: "United 쪽으로 배차하라는 지시나 요청 받은 적 있으십니까?"
A: "없습니다. 전혀 그런 일 없었습니다."

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
      "timestampLabel": string | null,
      "sourceCitations": [
        {
          "fileId": string,
          "fileName": string,
          "quote": string,
          "startChar": number | null,
          "endChar": number | null,
          "pageNumber": number | null,
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

function locationNames(
  incident: Incident,
  locations: FNSLocation[] = FNS_LOCATIONS
): string[] {
  return incident.involvedLocationIds.map((id) => {
    const loc =
      locations.find((l) => l.id === id) ?? FNS_LOCATIONS.find((l) => l.id === id);
    return loc?.name ?? id;
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

/**
 * Serializes the full incident workspace into a context block for the assistant.
 * Pass the merged seed + custom location list (e.g. from useAllLocations()) so
 * custom location ids resolve to names; defaults to the seed list otherwise.
 */
export function buildAssistantContext(
  incident: Incident,
  locations?: FNSLocation[]
): string {
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
INVOLVED LOCATIONS: ${locationNames(incident, locations).join("; ") || "(none)"}
OVERVIEW NOTES:
${serializeOverview(incident.overviewEntries)}

${sessions || "(no interview sessions yet)"}`;
}
