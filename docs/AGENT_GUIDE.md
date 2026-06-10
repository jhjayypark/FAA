# FAA (FNS Audit Assistant) — Feature Agent Guide

You are building one feature module of FAA, an internal audit web app for FNS, Inc.
(Korean logistics company, US branches). An internal auditor manages incidents,
uploads Korean interview transcripts/notes, extracts cited Q&A findings, and
builds PPTX reports.

**Golden rule: UI labels are English. All AI-generated/extracted content
(questions, answers, reasons, assistant replies) is Korean.**

## Stack and conventions

- Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui (in `components/ui/`), Zustand.
- All feature pages are client components (`"use client"`), data lives in localStorage via the store.
- Path alias `@/*` from repo root.
- Icons: ONLY `@hugeicons/react` + `@hugeicons/core-free-icons`:
  ```tsx
  import { HugeiconsIcon } from "@hugeicons/react";
  import { Search01Icon } from "@hugeicons/core-free-icons";
  <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
  ```
  Use ONLY icon names from the verified list below. Do NOT invent icon names; do NOT
  hand-roll SVG paths; do NOT install other icon packages.
- Toasts: `import { toast } from "sonner"` (Toaster is already mounted in layout).
- NEVER edit these shared files: `app/layout.tsx`, `app/globals.css`,
  `components/app-shell.tsx`, `components/ui/*`, `lib/types.ts`, `lib/store.ts`,
  `lib/format.ts`, `lib/locations.ts`, `lib/prompts.ts`, `lib/parse-files.ts`,
  `lib/extraction/*`. Read them; build on them.

## Verified icon names (exist in @hugeicons/core-free-icons)

BubbleChatIcon, AiChat02Icon, Folder01Icon, FolderOpenIcon, FolderDetailsIcon,
File01Icon, File02Icon, PlusSignIcon, Add01Icon, SearchIcon, Search01Icon,
Location01Icon, Location04Icon, Building01Icon, Building02Icon, Building03Icon,
Building05Icon, WarehouseIcon, Calendar01Icon, Calendar03Icon, Clock01Icon,
UserIcon, UserMultiple02Icon, Note01Icon, StickyNote01Icon, PencilEdit01Icon,
PencilEdit02Icon, Edit02Icon, Delete02Icon, Upload01Icon, CloudUploadIcon,
FileUploadIcon, Download01Icon, Download04Icon, QuoteDownIcon, QuoteUpIcon,
Alert02Icon, AlertCircleIcon, Tick02Icon, Cancel01Icon, SparklesIcon,
MagicWand01Icon, AiMagicIcon, PresentationBarChart01Icon, Presentation01Icon,
UnfoldMoreIcon, Sorting01Icon, SortingAZ02Icon, ViewIcon, EyeIcon,
ArrowRight01Icon, ArrowLeft01Icon, ArrowUp01Icon, ArrowDown01Icon, SentIcon,
Mic01Icon, Link01Icon, Idea01Icon, MoreHorizontalIcon, MoreVerticalIcon,
GitCommitIcon, Route01Icon, Flag02Icon, Activity01Icon, DocumentValidationIcon,
TaskDaily01Icon, Pdf01Icon, Doc01Icon, Txt01Icon, FileValidationIcon,
FileSearchIcon, FileEditIcon, CheckmarkCircle02Icon, InformationCircleIcon,
Loading03Icon, FilterIcon, Settings01Icon, Target01Icon, JusticeScale01Icon,
SecurityCheckIcon, ClipboardIcon, ListViewIcon, DashboardSquare01Icon,
Home01Icon, TimeQuarterPassIcon, ChartHistogramIcon, DocumentAttachmentIcon,
LicenseDraftIcon, Bookmark01Icon, PinIcon, Menu01Icon

## Foundation API (read these files before coding)

### `lib/types.ts`
All domain types: `Incident`, `OverviewEntry`, `InterviewSession`,
`UploadedInterviewFile`, `ExtractionSettings`, `QAItem`, `SourceCitation`,
`Importance`, `ChatMessage`, `ExtractedQAItem`, `ExtractionResult`,
`ReportOptions`, plus constants `MANDATORY_EXTRACTION_RULES`,
`DEFAULT_EXTRACTION_SETTINGS`, `UNKNOWN_INTERVIEWEE`.

### `lib/store.ts` (Zustand, persisted)
```ts
useFAAStore()         // state + actions; see file for full signatures
useAllLocations()     // FNSLocation[] (seed + custom)
useIncident(id)       // Incident | undefined
useHydrated()         // boolean; render skeletons until true
locationById(all, id) // helper
```
Actions: `addIncident`, `updateIncident`, `deleteIncident`, `addOverviewEntry`,
`updateOverviewEntry`, `deleteOverviewEntry`, `addCustomLocation`,
`addInterviewSession`, `updateInterviewSession`, `deleteInterviewSession`,
`updateQAItem`, `addAssistantMessage`, `clearAssistantThread`.

IMPORTANT: every page must gate on `useHydrated()` and show skeletons
(`components/ui/skeleton.tsx`) before hydration, or SSR mismatch errors occur.

### `lib/extraction/extract.ts`
`extractInterviewInsights({ incident, overviewEntries, uploadedFiles, settings, onProgress })`
returns `Promise<ExtractionResult>`. `onProgress(stage, percent)` fires per pipeline stage.

### `lib/parse-files.ts`
`parseUploadedFile(file: File): Promise<string>` (txt/md/docx/pdf; throws
`FileParseError` with a user-facing message, e.g. audio/video placeholder).
`ACCEPTED_FILE_TYPES` for `<input accept>`.

### `lib/format.ts`
`formatDate`, `formatDateTime`, `formatRelative`, `charCount`, `wordCount`,
`truncate`, `fileExtension`, `newId`, `nowIso`.

### `lib/prompts.ts`
`EXTRACTION_SYSTEM_PROMPT`, `ASSISTANT_SYSTEM_PROMPT`, `ASSISTANT_CANNOT_VERIFY`,
`buildExtractionUserPrompt`, `buildAssistantContext(incident)`.

### Shared components
- `components/importance-badge.tsx`: `<ImportanceBadge importance={...} />`
- `components/app-shell.tsx`: already wraps every page (sidebar + scrollable main).

## Routes (contracts between modules)

| Route | Owner | Purpose |
|---|---|---|
| `/incidents` | incidents-list | List + Add Incident modal |
| `/incidents/[id]` | incident-detail | Header + `Overview` / `Interview` tabs (`?tab=interview`) |
| `/incidents/[id]/extract` | extraction-flow | Upload -> rules -> run extraction -> create session -> redirect |
| `/incidents/[id]/sessions/[sessionId]` | results | Q&A cards, edit, sort, source viewer, report entry point |
| `/assistant` | assistant | Incident-scoped Korean chat |

Cross-module component contract:
- `components/report/report-dialog.tsx` (owner: report) MUST export
  `ReportDialog({ incident, session, open, onOpenChange }: { incident: Incident; session: InterviewSession; open: boolean; onOpenChange: (open: boolean) => void })`.
  The results page imports it for the `Generate PPTX` button.

## Design system (follow exactly)

Tone: serious internal investigation tool. Calm, precise, enterprise. No playful
visuals, no marketing flourishes.

- Light theme only. Tokens are set; use semantic classes: `bg-background`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`,
  `bg-primary text-primary-foreground` (deep navy), `bg-muted`.
  NEVER hardcode hex colors or use Tailwind palette colors (no `bg-blue-500`),
  except the importance badge component which already exists.
- Page container: `mx-auto w-full max-w-5xl px-6 py-8` (lists/detail) unless the
  module spec says otherwise. Page title: `text-xl font-semibold tracking-tight`.
  Section headings: `text-sm font-semibold`. Body: `text-sm`. Metadata/dates/counts:
  `font-mono text-xs text-muted-foreground`.
- Korean AI content blocks: `text-[15px] leading-relaxed` for readability.
- Radius: use `rounded-md` / `rounded-lg` only (theme radius is set). One shape system.
- Motion: `transition-colors duration-150` on interactive elements only. No
  entrance animations, no infinite loops, no parallax.
- Buttons: shadcn `<Button>`; primary action = default variant, secondary =
  `variant="outline"`, destructive = `variant="destructive"`. One primary action
  per view. Labels max 3 words ("Add Incident", "Start Extraction").
- Forms: `<Label>` ABOVE input, `gap-2` blocks, helper/error text below in
  `text-xs text-destructive`. Never placeholder-as-label.
- Empty states: centered block with icon (muted), title `text-sm font-semibold`,
  one-line description `text-sm text-muted-foreground`, CTA button. Compose
  beautifully, no cartoon illustrations.
- Loading: skeletons matching final layout shape, no spinners except inline button
  loading (`Loading03Icon` with `animate-spin` is allowed there).
- Deletes: ALWAYS confirm via `components/ui/alert-dialog.tsx`.
- Feedback: `toast.success(...)` / `toast.error(...)` for create/delete/download/errors.

### Hard content rules (zero tolerance)
- NO em-dash and NO en-dash anywhere in user-visible strings. Use commas,
  periods, colons, or hyphens.
- NO emojis anywhere.
- NO decorative status dots; colored dots only for real semantic state.
- English UI labels; Korean for extracted/AI content and suggested prompts.
- No invented "cute" copy. Plain, functional, professional sentences.
- Sample/placeholder people names must be realistic Korean names (김민수, 박지현),
  never "John Doe".

## Quality bar

- Every interactive flow handles: empty, loading, error, success.
- Keyboard: Enter submits single-field forms; Escape closes dialogs (shadcn default).
- Responsive: pages collapse to single column under 768px; no horizontal scroll.
- After implementing, run `npx tsc --noEmit` and `npx next lint --dir <your files>`
  if available; fix all errors in YOUR files before finishing.
