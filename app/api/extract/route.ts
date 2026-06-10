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

  // The model is asked for ALL items regardless of the importantOnly setting;
  // the filter is applied here so prefilterCount stays accurate for the UI.
  const userPrompt = buildExtractionUserPrompt({
    incident: body.incident,
    overviewEntries: body.overviewEntries ?? [],
    uploadedFiles: body.uploadedFiles,
    settings: { ...body.settings, importantOnly: false },
  });

  try {
    // Streamed to avoid HTTP timeouts on long extractions; the full message
    // is still consumed server-side and returned as one JSON response.
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      messages: [{ role: "user", content: userPrompt }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "The model declined to process these materials." }, { status: 422 });
    }
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The materials are too large for one extraction. Split the files and retry." },
        { status: 422 }
      );
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    const llm = JSON.parse(text) as LLMExtraction;

    return NextResponse.json(toExtractionResult(llm, body.uploadedFiles, body.settings));
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      // Surfaces the real cause (billing, schema, rate limit) in server logs;
      // the client only needs to know to fall back.
      console.error(`Anthropic API error ${err.status}: ${err.message}`);
      const status = err.status === 429 || err.status === 529 ? 503 : 502;
      return NextResponse.json(
        { error: `Extraction service error (${err.status ?? "network"}).` },
        { status }
      );
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Model returned malformed JSON." }, { status: 502 });
    }
    throw err;
  }
}
