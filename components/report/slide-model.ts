import type {
  Importance,
  Incident,
  InterviewSession,
  QAItem,
  ReportOptions,
} from "@/lib/types";
import { UNKNOWN_INTERVIEWEE } from "@/lib/types";
import { formatDate, nowIso, truncate } from "@/lib/format";

/**
 * Shared slide model for the PPTX report.
 * Both the HTML preview (components/report/slide-preview.tsx) and the real
 * PPTX generator (lib/report/generate-pptx.ts) render from this exact model,
 * so the preview always mirrors the downloaded file.
 */

export type FindingItem = {
  question: string;
  answerExcerpt: string;
  importance: Importance;
};

export type QASlideItem = {
  question: string;
  answer: string;
  importance: Importance;
  citation?: { fileName: string; quote: string };
};

export type AppendixItem = {
  number: number;
  question: string;
};

export type RosterRow = {
  name: string;
  interviewDate: string;
  totalQA: number;
  highCount: number;
  includedCount: number;
};

export type ReportSlide =
  | {
      kind: "cover";
      title: string;
      incidentName: string;
      generatedOn: string;
      locationNames: string[];
    }
  | { kind: "context"; body: string }
  | {
      kind: "roster";
      rows: RosterRow[];
      pageIndex: number;
      pageCount: number;
    }
  | {
      kind: "summary";
      intervieweeName: string;
      interviewDate: string;
      extractionDate: string;
      fileLines: string[];
      totalQA: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      includedCount: number;
    }
  | {
      kind: "findings";
      items: FindingItem[];
      pageIndex: number;
      pageCount: number;
      /** Set on incident-level decks; suffixes the slide heading. */
      interviewee?: string;
    }
  | { kind: "qa"; items: QASlideItem[]; interviewee?: string }
  | {
      kind: "appendix";
      items: AppendixItem[];
      pageIndex: number;
      pageCount: number;
      interviewee?: string;
    };

const IMPORTANCE_RANK: Record<Importance, number> = { High: 0, Medium: 1, Low: 2 };

const FINDINGS_PER_SLIDE = 5;
const QA_PER_SLIDE = 2;
const APPENDIX_PER_SLIDE = 8;
const ROSTER_PER_SLIDE = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Q&A items marked for the report, in orderIndex order. */
export function includedItems(session: InterviewSession): QAItem[] {
  return session.qaItems
    .filter((q) => q.includedInReport)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

function withInterviewee(heading: string, interviewee?: string): string {
  return interviewee ? `${heading} — ${interviewee}` : heading;
}

/** English heading shown on each content slide. Identical in preview and PPTX. */
export function slideHeading(slide: ReportSlide): string {
  switch (slide.kind) {
    case "cover":
      return "";
    case "context":
      return "Incident Context";
    case "roster":
      return slide.pageCount > 1
        ? `Interviewee Overview (${slide.pageIndex + 1} of ${slide.pageCount})`
        : "Interviewee Overview";
    case "summary":
      return "Interviewee Summary";
    case "findings":
      return withInterviewee(
        slide.pageCount > 1
          ? `Key Findings (${slide.pageIndex + 1} of ${slide.pageCount})`
          : "Key Findings",
        slide.interviewee
      );
    case "qa":
      return withInterviewee("Q&A", slide.interviewee);
    case "appendix":
      return withInterviewee(
        slide.pageCount > 1
          ? `Appendix: Selected Q&A (${slide.pageIndex + 1} of ${slide.pageCount})`
          : "Appendix: Selected Q&A",
        slide.interviewee
      );
  }
}

function displayName(session: InterviewSession): string {
  return session.intervieweeName?.trim() || UNKNOWN_INTERVIEWEE;
}

/**
 * Summary, findings, and Q&A slides for one session. When `interviewee` is
 * set (incident-level decks), findings and Q&A slides carry it so their
 * headings identify the session.
 */
function buildSessionSection({
  session,
  options,
  interviewee,
}: {
  session: InterviewSession;
  options: ReportOptions;
  interviewee?: string;
}): ReportSlide[] {
  const slides: ReportSlide[] = [];
  const included = includedItems(session);
  const all = session.qaItems;
  const tag = interviewee ? { interviewee } : {};

  // Interviewee summary
  const fileNames = session.uploadedFiles.map((f) => f.fileName);
  const fileLines = fileNames.slice(0, 4);
  if (fileNames.length > 4) {
    fileLines.push(`and ${fileNames.length - 4} more files`);
  }
  slides.push({
    kind: "summary",
    intervieweeName: displayName(session),
    interviewDate: formatDate(session.interviewDate) || "Not specified",
    extractionDate: formatDate(session.createdAt) || "Not specified",
    fileLines,
    totalQA: all.length,
    highCount: all.filter((q) => q.importance === "High").length,
    mediumCount: all.filter((q) => q.importance === "Medium").length,
    lowCount: all.filter((q) => q.importance === "Low").length,
    includedCount: included.length,
  });

  // Key findings: High-importance included items first. If no High items
  // exist, fall back to the top included items by importance rank.
  const highIncluded = included.filter((q) => q.importance === "High");
  const findingsSource =
    highIncluded.length > 0
      ? highIncluded
      : [...included]
          .sort(
            (a, b) =>
              IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] ||
              a.orderIndex - b.orderIndex
          )
          .slice(0, FINDINGS_PER_SLIDE);
  const findingPages = chunk(findingsSource, FINDINGS_PER_SLIDE);
  findingPages.forEach((page, pageIndex) => {
    slides.push({
      kind: "findings",
      pageIndex,
      pageCount: findingPages.length,
      items: page.map((q) => ({
        question: truncate(oneLine(q.question), 110),
        answerExcerpt: truncate(oneLine(q.answer), 140),
        importance: q.importance,
      })),
      ...tag,
    });
  });

  // Q&A slides, two items per slide, orderIndex order. Answers carry the
  // "(이름)" speaker prefix from the PPT template (예시 말투.pptx) when the
  // interviewee is known.
  const namePrefix = session.intervieweeName?.trim()
    ? `(${session.intervieweeName.trim()}) `
    : "";
  chunk(included, QA_PER_SLIDE).forEach((page) => {
    slides.push({
      kind: "qa",
      items: page.map((q) => {
        const citation = options.includeCitations ? q.sourceCitations[0] : undefined;
        return {
          question: truncate(oneLine(q.question), 110),
          answer: truncate(`${namePrefix}${q.answer.trim()}`, 420),
          importance: q.importance,
          citation: citation
            ? {
                fileName: citation.fileName,
                quote: truncate(oneLine(citation.quote), 80),
              }
            : undefined,
        };
      }),
      ...tag,
    });
  });

  return slides;
}

/**
 * Appendix slides for one session: compact numbered list of all included
 * questions, numbered 1..n within the session, 8 per slide. Empty when the
 * appendix is disabled or nothing is included.
 */
function buildSessionAppendix({
  session,
  options,
  interviewee,
}: {
  session: InterviewSession;
  options: ReportOptions;
  interviewee?: string;
}): ReportSlide[] {
  const included = includedItems(session);
  if (!options.includeAppendix || included.length === 0) return [];

  const tag = interviewee ? { interviewee } : {};
  const numbered = included.map((q, i) => ({
    number: i + 1,
    question: truncate(oneLine(q.question), 120),
  }));
  const appendixPages = chunk(numbered, APPENDIX_PER_SLIDE);
  return appendixPages.map((page, pageIndex) => ({
    kind: "appendix",
    items: page,
    pageIndex,
    pageCount: appendixPages.length,
    ...tag,
  }));
}

/** Slide model for the single-session report. */
export function buildSlideModels({
  incident,
  session,
  options,
  locationNames,
}: {
  incident: Incident;
  session: InterviewSession;
  options: ReportOptions;
  locationNames: string[];
}): ReportSlide[] {
  const slides: ReportSlide[] = [];

  // 1) Cover
  slides.push({
    kind: "cover",
    title: options.title.trim() || `${incident.name} Interview Findings`,
    incidentName: incident.name,
    generatedOn: formatDate(nowIso()),
    locationNames: options.includeLocations ? locationNames : [],
  });

  // 2) Incident context
  const context = incident.context?.trim();
  if (options.includeIncidentContext && context) {
    slides.push({ kind: "context", body: truncate(context, 900) });
  }

  // 3) Summary, findings, Q&A, then appendix
  slides.push(...buildSessionSection({ session, options }));
  slides.push(...buildSessionAppendix({ session, options }));

  return slides;
}

/**
 * Slide model for the incident-level combined report covering all passed
 * sessions, in the given order. The roster lists every session; sessions
 * without included Q&A items are skipped after that. Appendix slides for all
 * sessions come after every interviewee section.
 */
export function buildIncidentSlideModels({
  incident,
  sessions,
  options,
  locationNames,
}: {
  incident: Incident;
  sessions: InterviewSession[];
  options: ReportOptions;
  locationNames: string[];
}): ReportSlide[] {
  const slides: ReportSlide[] = [];

  // 1) Cover
  slides.push({
    kind: "cover",
    title: options.title.trim() || `${incident.name} Combined Interview Findings`,
    incidentName: incident.name,
    generatedOn: formatDate(nowIso()),
    locationNames: options.includeLocations ? locationNames : [],
  });

  // 2) Incident context
  const context = incident.context?.trim();
  if (options.includeIncidentContext && context) {
    slides.push({ kind: "context", body: truncate(context, 900) });
  }

  // 3) Roster: one row per session, even when nothing is included
  const rows: RosterRow[] = sessions.map((session) => ({
    name: displayName(session),
    interviewDate: formatDate(session.interviewDate) || "Not specified",
    totalQA: session.qaItems.length,
    highCount: session.qaItems.filter((q) => q.importance === "High").length,
    includedCount: includedItems(session).length,
  }));
  const rosterPages = chunk(rows, ROSTER_PER_SLIDE);
  rosterPages.forEach((page, pageIndex) => {
    slides.push({
      kind: "roster",
      rows: page,
      pageIndex,
      pageCount: rosterPages.length,
    });
  });

  // 4) One section per session with included items
  const reportable = sessions.filter((s) => includedItems(s).length > 0);
  for (const session of reportable) {
    slides.push(
      ...buildSessionSection({ session, options, interviewee: displayName(session) })
    );
  }

  // 5) Appendix sections after all interviewee sections, in session order
  for (const session of reportable) {
    slides.push(
      ...buildSessionAppendix({ session, options, interviewee: displayName(session) })
    );
  }

  return slides;
}
