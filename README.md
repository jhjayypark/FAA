# FAA - FNS Audit Assistant

Internal audit workspace for FNS, Inc. An internal auditor manages incidents
across FNS locations in the United States, uploads Korean interview transcripts
and manual notes, extracts cited Q&A findings with strict anti-hallucination
rules, and generates PPTX report drafts.

The interface is English; all AI-generated interview output (questions,
answers, importance reasons, assistant replies) is Korean.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Data persists in the browser via localStorage
(no backend in this MVP).

## Try it quickly

Sample Korean interview materials live in `public/samples/`:

- `김민수_인터뷰_녹취록.txt` - speaker-labeled transcript
- `수기노트_김민수_면담.md` - shorthand manual notes

Create an incident (for example "Moonachie 창고 5월 재고 불일치"), open the
Interview tab, choose Start Extraction, and upload one or both files.

## Architecture notes

- `lib/types.ts` - domain model (incidents, sessions, Q&A items, citations)
- `lib/store.ts` - Zustand store persisted to localStorage
- `lib/extraction/` - extraction pipeline. `extract.ts` is the provider-ready
  entry point; `mock-extractor.ts` is the current heuristic engine that parses
  Q/A markers, speaker dialogue, and note bullets with exact character offsets
  so every citation highlights its true source span.
- `lib/prompts.ts` - the strict extraction and assistant system prompts used
  when a real LLM provider is connected.
- `lib/assistant/` - incident-scoped assistant (mock, LLM-ready).
- `lib/report/` - PPTX generation via pptxgenjs.
- `docs/AGENT_GUIDE.md` - internal design-system and module contracts.

To connect a real LLM later, implement `runLLMExtraction` in
`lib/extraction/extract.ts` and the provider call in `lib/assistant/answer.ts`;
prompts and JSON shapes are already in place.

## Tests

```bash
npx tsx scripts/test-extract.ts   # extraction engine smoke test with offset checks
```
