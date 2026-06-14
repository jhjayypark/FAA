/**
 * Extraction pipeline entry point.
 *
 * Tries the LLM route (app/api/extract — Claude with the strict prompt in
 * lib/prompts.ts) first and falls back to the heuristic extractor when the
 * server has no API key configured (503) or the call fails, so the app stays
 * usable offline and without billing set up.
 */

import type {
  ExtractionResult,
  ExtractionSettings,
  Incident,
  OverviewEntry,
  UploadedInterviewFile,
} from "@/lib/types";
import { runMockExtraction } from "@/lib/extraction/mock-extractor";

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

/** Sticky availability flag: once the server says "no key", skip the
 * round-trip for the rest of the session. */
let llmUnavailable = false;

async function runLLMExtraction(input: ExtractInput): Promise<ExtractionResult | null> {
  if (llmUnavailable) return null;
  const { incident, overviewEntries, uploadedFiles, settings } = input;

  let response: Response;
  try {
    response = await fetch("/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ incident, overviewEntries, uploadedFiles, settings }),
    });
  } catch {
    return null; // network failure — fall back to the heuristic extractor
  }

  if (response.status === 503) {
    llmUnavailable = true;
    return null;
  }
  if (!response.ok) {
    console.warn(`LLM extraction failed (${response.status}); using heuristic extractor.`);
    return null;
  }
  return (await response.json()) as ExtractionResult;
}

export async function extractInterviewInsights(input: ExtractInput): Promise<ExtractionResult> {
  const { onProgress } = input;

  // Staged progress so the extraction UI reflects honest pipeline phases.
  // The LLM call spans the middle stages; the heuristic path is near-instant.
  for (let i = 0; i < 2; i++) {
    onProgress?.(STAGES[i], Math.round((i / STAGES.length) * 100));
    await sleep(350);
  }

  // The LLM call can run for a minute or more on a long transcript. Without a
  // ticker the bar would sit frozen at 40% and look hung, so creep it forward
  // toward 90% while the request is in flight; completion snaps it to 100%.
  let pct = 40;
  onProgress?.(STAGES[2], pct);
  const ticker = setInterval(() => {
    pct = Math.min(pct + 2, 90);
    onProgress?.(pct < 70 ? STAGES[2] : STAGES[3], pct);
  }, 1500);

  let llmResult: ExtractionResult | null;
  try {
    llmResult = await runLLMExtraction(input);
  } finally {
    clearInterval(ticker);
  }

  onProgress?.(STAGES[3], Math.max(pct, 92));
  const result = llmResult ?? runMockExtraction(input);

  onProgress?.(STAGES[STAGES.length - 1], 100);
  await sleep(300);
  return result;
}
