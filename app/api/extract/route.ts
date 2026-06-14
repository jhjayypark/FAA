import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExtractedQAItem,
  ExtractionResult,
  ExtractionSettings,
  Importance,
  Incident,
  OverviewEntry,
  SourceCitation,
  UploadedInterviewFile,
} from "@/lib/types";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "@/lib/prompts";

/**
 * LLM-backed interview Q&A extraction.
 *
 * Runs server-side so the Anthropic API key never reaches the browser. When
 * ANTHROPIC_API_KEY is not configured the route answers 503 and the client
 * falls back to the heuristic extractor (lib/extraction/mock-extractor.ts),
 * so the app keeps working without a key.
 *
 * The interview materials are sent to the model and the structured result is
 * returned to the client; nothing is persisted server-side (the app stores
 * everything in the browser, same as the link importer).
 */

// Extraction of a long transcript with adaptive thinking can exceed the
// default function duration; Vercel clamps this to the plan's ceiling.
export const maxDuration = 300;

const MODEL = "claude-opus-4-8";

/** Schema enforced via structured outputs — mirrors ExtractionResult, minus
 * citation offsets, which are recovered server-side by exact quote search. */
const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    intervieweeName: { type: ["string", "null"] },
    interviewDate: {
      type: ["string", "null"],
      description: "ISO yyyy-mm-dd interview date when stated in the materials",
    },
    qaItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          importance: { type: "string", enum: ["High", "Medium", "Low"] },
          importanceReason: { type: "string" },
          extractionNote: { type: ["string", "null"] },
          includedInReport: { type: "boolean" },
          timestampLabel: { type: ["string", "null"] },
          sourceCitations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fileId: { type: "string" },
                fileName: { type: "string" },
                quote: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["fileId", "fileName", "quote", "confidence"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "question",
          "answer",
          "importance",
          "importanceReason",
          "extractionNote",
          "includedInReport",
          "timestampLabel",
          "sourceCitations",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["intervieweeName", "interviewDate", "qaItems"],
  additionalProperties: false,
} as const;

type LLMCitation = { fileId: string; fileName: string; quote: string; confidence: number };
type LLMQAItem = {
  question: string;
  answer: string;
  importance: Importance;
  importanceReason: string;
  extractionNote: string | null;
  includedInReport: boolean;
  timestampLabel: string | null;
  sourceCitations: LLMCitation[];
};
type LLMExtraction = {
  intervieweeName: string | null;
  interviewDate: string | null;
  qaItems: LLMQAItem[];
};

type ExtractRequest = {
  incident: Incident;
  overviewEntries: OverviewEntry[];
  uploadedFiles: UploadedInterviewFile[];
  settings: ExtractionSettings;
};

/**
 * Recovers source-viewer offsets for a citation by locating the quote in the
 * cited file. Exact match first; if the model normalized whitespace, retry
 * with a whitespace-flexible search before giving up (quote-only citation).
 */
function resolveCitation(
  citation: LLMCitation,
  files: UploadedInterviewFile[]
): SourceCitation | null {
  const file =
    files.find((f) => f.id === citation.fileId) ??
    files.find((f) => f.fileName === citation.fileName);
  if (!file) return null;

  const quote = citation.quote.trim();
  if (!quote) return null;
  const confidence = Math.min(Math.max(citation.confidence, 0), 1);

  const base: SourceCitation = {
    fileId: file.id,
    fileName: file.fileName,
    quote,
    confidence,
  };

  const exact = file.contentText.indexOf(quote);
  if (exact >= 0) {
    return { ...base, startChar: exact, endChar: exact + quote.length };
  }

  const flexible = new RegExp(
    quote
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+")
  );
  const match = flexible.exec(file.contentText);
  if (match) {
    return {
      ...base,
      quote: match[0],
      startChar: match.index,
      endChar: match.index + match[0].length,
    };
  }

  return base; // quote not located — keep the citation without highlight offsets
}

function toExtractionResult(
  llm: LLMExtraction,
  files: UploadedInterviewFile[],
  settings: ExtractionSettings
): ExtractionResult {
  let qaItems: ExtractedQAItem[] = llm.qaItems
    .filter((qa) => qa.question.trim() && qa.answer.trim())
    .map((qa) => ({
      question: qa.question.trim(),
      answer: qa.answer.trim(),
      importance: qa.importance,
      importanceReason: qa.importanceReason,
      extractionNote: qa.extractionNote ?? undefined,
      includedInReport: qa.includedInReport,
      timestampLabel: qa.timestampLabel ?? undefined,
      sourceCitations: qa.sourceCitations
        .map((c) => resolveCitation(c, files))
        .filter((c): c is SourceCitation => c !== null),
    }))
    // ABSOLUTE RULES require source grounding; an item with no resolvable
    // citation cannot be verified and is dropped.
    .filter((qa) => qa.sourceCitations.length > 0);

  const prefilterCount = qaItems.length;
  if (settings.importantOnly) {
    qaItems = qaItems
      .filter((qa) => qa.importance !== "Low")
      .map((qa) => ({ ...qa, includedInReport: true }));
  }

  return {
    intervieweeName: llm.intervieweeName,
    interviewDate: llm.interviewDate,
    qaItems,
    prefilterCount,
  };
}

/** Above this many characters a transcript is split so no single LLM call
 * risks the 32K output ceiling or the function-duration limit. ~6K chars is
 * roughly 25-30 spoken turns, which the model handles in well under a minute. */
const TRANSCRIPT_CHUNK_CHARS = 6000;
/** Parallel LLM calls allowed at once — bounded to stay clear of rate limits
 * (the SDK already retries 429/529 with backoff). */
const MAX_CONCURRENCY = 4;

/** A line that begins a new speaker turn / numbered question — a safe split point. */
const TURN_START = /^\s*(?:(?:Speaker|화자)\s*\d|[가-힣A-Za-z][가-힣A-Za-z0-9 .]{0,19}?\s*[::]|\d{1,2}[.)]\s|Q\d*\s*[.:)])/i;
/** Leading metadata lines ("면담 대상: …", "일시: …") that are header, not a turn. */
const HEADER_META =
  /^\s*(?:면담\s*대상|인터뷰\s*대상|대상자?|일시|날짜|일자|시간|장소|참석자?|진행자?|면담자|작성자|소속|직급|부서)\s*[::]/;

/**
 * Splits one transcript's text into chunks at turn boundaries, each at or below
 * TRANSCRIPT_CHUNK_CHARS, with the leading metadata header (면담 대상 / 일시 …)
 * prepended to every chunk so each call keeps interviewee context. A turn that
 * is itself larger than the budget is emitted whole rather than cut mid-answer.
 */
function splitTranscript(text: string): string[] {
  if (text.length <= TRANSCRIPT_CHUNK_CHARS) return [text];

  const lines = text.split("\n");
  // Header = leading blank/metadata lines, up to the first real turn. The meta
  // lines match TURN_START's "key:" shape, so they are detected explicitly.
  let firstTurn = 0;
  while (
    firstTurn < lines.length &&
    (lines[firstTurn].trim() === "" || HEADER_META.test(lines[firstTurn]))
  ) {
    firstTurn++;
  }
  const header = lines.slice(0, firstTurn).join("\n").trim();
  const headerPrefix = header ? `${header}\n\n` : "";

  // Group lines into turns (a turn = its start line + following continuation lines).
  const turns: string[] = [];
  let cur = "";
  for (const line of lines.slice(firstTurn)) {
    if (TURN_START.test(line) && cur) {
      turns.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur.trim()) turns.push(cur);

  const chunks: string[] = [];
  let body = "";
  const budget = TRANSCRIPT_CHUNK_CHARS - headerPrefix.length;
  for (const turn of turns) {
    if (body && body.length + turn.length + 1 > budget) {
      chunks.push(headerPrefix + body.trim());
      body = turn;
    } else {
      body = body ? `${body}\n${turn}` : turn;
    }
  }
  if (body.trim()) chunks.push(headerPrefix + body.trim());
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Builds the set of file groups to extract. Small inputs → one group (all files
 * together). When a transcript is large it is split into chunks; each chunk is
 * paired with ALL manual-note files (kept whole, since a note matches whichever
 * chunk covers its exchange). Chunk files keep the original id/fileName so the
 * model echoes them and citations resolve against the full original text.
 */
function buildFileGroups(files: UploadedInterviewFile[]): UploadedInterviewFile[][] {
  const transcripts = files.filter((f) => f.sourceType !== "manual_notes");
  const notes = files.filter((f) => f.sourceType === "manual_notes");
  const totalTranscript = transcripts.reduce((n, f) => n + f.contentText.length, 0);
  if (totalTranscript <= TRANSCRIPT_CHUNK_CHARS) return [files];

  const groups: UploadedInterviewFile[][] = [];
  for (const t of transcripts) {
    for (const piece of splitTranscript(t.contentText)) {
      groups.push([{ ...t, contentText: piece }, ...notes]);
    }
  }
  // A notes-only upload (no transcript) still needs one group.
  return groups.length > 0 ? groups : [files];
}

async function runChunk(
  client: Anthropic,
  group: UploadedInterviewFile[],
  body: ExtractRequest
): Promise<LLMExtraction> {
  const userPrompt = buildExtractionUserPrompt({
    incident: body.incident,
    overviewEntries: body.overviewEntries ?? [],
    uploadedFiles: group,
    // The model returns ALL items; the importantOnly filter is applied locally.
    settings: { ...body.settings, importantOnly: false },
  });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    system: EXTRACTION_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new ExtractionError("The model declined to process these materials.", 422);
  }
  if (message.stop_reason === "max_tokens") {
    // Should not happen now that transcripts are chunked, but guard anyway.
    throw new ExtractionError("A section was too large to extract in one pass.", 422);
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as LLMExtraction;
}

class ExtractionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type Settled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/** Runs the async tasks with a fixed concurrency cap, preserving order. A task
 * that throws is captured (not propagated) so one failed chunk does not discard
 * the chunks that succeeded — the caller decides what to do with partial results. */
async function mapSettledWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<Settled<R>[]> {
  const results = new Array<Settled<R>>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { ok: true, value: await fn(items[i], i) };
      } catch (error) {
        results[i] = { ok: false, error };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Normalized question key for cross-chunk de-duplication (notes repeat per chunk). */
function questionKey(q: string): string {
  return q.replace(/[\s?？.!,…~"'()]/g, "").toLowerCase();
}

/** Merges per-chunk extractions: first non-null name/date wins; items are
 * concatenated in chunk order and de-duplicated by normalized question, with
 * the duplicate's citations folded into the kept item. */
function mergeExtractions(parts: LLMExtraction[]): LLMExtraction {
  const merged: LLMExtraction = { intervieweeName: null, interviewDate: null, qaItems: [] };
  const byQuestion = new Map<string, LLMQAItem>();
  for (const part of parts) {
    merged.intervieweeName ??= part.intervieweeName;
    merged.interviewDate ??= part.interviewDate;
    for (const item of part.qaItems) {
      const key = questionKey(item.question);
      const existing = byQuestion.get(key);
      if (existing) {
        const seen = new Set(existing.sourceCitations.map((c) => `${c.fileId}|${c.quote}`));
        for (const c of item.sourceCitations) {
          if (!seen.has(`${c.fileId}|${c.quote}`)) existing.sourceCitations.push(c);
        }
      } else {
        byQuestion.set(key, item);
        merged.qaItems.push(item);
      }
    }
  }
  return merged;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "LLM extraction is not configured (ANTHROPIC_API_KEY missing)." },
      { status: 503 }
    );
  }

  let body: ExtractRequest;
  try {
    body = (await request.json()) as ExtractRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body?.incident || !Array.isArray(body.uploadedFiles) || body.uploadedFiles.length === 0) {
    return NextResponse.json({ error: "incident and uploadedFiles are required." }, { status: 400 });
  }

  const client = new Anthropic();
  const groups = buildFileGroups(body.uploadedFiles);

  const settled = await mapSettledWithConcurrency(groups, MAX_CONCURRENCY, (group) =>
    runChunk(client, group, body)
  );
  const parts = settled.filter((s): s is { ok: true; value: LLMExtraction } => s.ok).map((s) => s.value);

  // Every chunk failed → report the first error so the client can fall back.
  if (parts.length === 0) {
    const firstError = settled.find((s) => !s.ok) as { ok: false; error: unknown } | undefined;
    const err = firstError?.error;
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${err.status}: ${err.message}`);
      const status = err.status === 429 || err.status === 529 ? 503 : 502;
      return NextResponse.json({ error: `Extraction service error (${err.status ?? "network"}).` }, { status });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Model returned malformed JSON." }, { status: 502 });
    }
    return NextResponse.json({ error: "Extraction failed." }, { status: 502 });
  }

  // Some chunks may have failed; the rest still produce a usable (partial) result
  // rather than discarding everything and falling back to the heuristic.
  if (parts.length < groups.length) {
    console.warn(`Extraction: ${groups.length - parts.length}/${groups.length} chunks failed; returning partial result.`);
  }

  const merged = mergeExtractions(parts);
  // Citations resolve against the ORIGINAL full files so offsets are correct.
  return NextResponse.json(toExtractionResult(merged, body.uploadedFiles, body.settings));
}
