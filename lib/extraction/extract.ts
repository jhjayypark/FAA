/**
 * Extraction pipeline entry point.
 *
 * Today this routes to the heuristic mock extractor. The function signature,
 * prompt constants (lib/prompts.ts), and JSON output shape are already
 * LLM-ready: connecting a provider only requires implementing
 * `runLLMExtraction` and setting an API key.
 */

import type {
  ExtractionResult,
  ExtractionSettings,
  Incident,
  OverviewEntry,
  UploadedInterviewFile,
} from "@/lib/types";
import { runMockExtraction } from "@/lib/extraction/mock-extractor";
// Imported so the wiring for a real provider call is in place and type-checked.
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "@/lib/prompts";

export type ExtractionStage =
  | "Parsing source files"
  | "Identifying interview structure"
  | "Extracting Q&A pairs"
  | "Scoring importance"
  | "Attaching source citations";

export type ExtractInput = {
  incident: Incident;
  overviewEntries: OverviewEntry[];
  uploadedFiles: UploadedInterviewFile[];
  settings: ExtractionSettings;
  /** Optional progress callback for the extraction UI. */
  onProgress?: (stage: ExtractionStage, percent: number) => void;
};

const STAGES: ExtractionStage[] = [
  "Parsing source files",
  "Identifying interview structure",
  "Extracting Q&A pairs",
  "Scoring importance",
  "Attaching source citations",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function llmConfigured(): boolean {
  // TODO: Replace mock extraction with real LLM provider call.
  // When a provider is connected, gate on its API key here, e.g.:
  // return Boolean(process.env.NEXT_PUBLIC_LLM_PROXY_URL);
  return false;
}

async function runLLMExtraction(input: ExtractInput): Promise<ExtractionResult> {
  // TODO: Replace mock extraction with real LLM provider call.
  // The request payload is already prepared:
  const systemPrompt = EXTRACTION_SYSTEM_PROMPT;
  const userPrompt = buildExtractionUserPrompt(input);
  void systemPrompt;
  void userPrompt;
  throw new Error("No LLM provider configured.");
}

export async function extractInterviewInsights(input: ExtractInput): Promise<ExtractionResult> {
  const { onProgress } = input;

  // Staged progress so the extraction UI reflects honest pipeline phases.
  for (let i = 0; i < STAGES.length - 1; i++) {
    onProgress?.(STAGES[i], Math.round((i / STAGES.length) * 100));
    await sleep(450);
  }

  const result = llmConfigured()
    ? await runLLMExtraction(input)
    : runMockExtraction(input);

  onProgress?.(STAGES[STAGES.length - 1], 100);
  await sleep(300);
  return result;
}
