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
    }
  | { kind: "qa"; items: QASlideItem[] }
  | {
      kind: "appendix";
      items: AppendixItem[];
      pageIndex: number;
      pageCount: number;
    };

const IMPORTANCE_RANK: Record<Importance, number> = { High: 0, Medium: 1, Low: 2 };

const FINDINGS_PER_SLIDE = 5;
const QA_PER_SLIDE = 2;
const APPENDIX_PER_SLIDE = 8;

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

/** English heading shown on each content slide. Identical in preview and PPTX. */
export function slideHeading(slide: ReportSlide): string {
  switch (slide.kind) {
    case "cover":
      return "";
    case "context":
      return "Incident Context";
    case "summary":
      return "Interviewee Summary";
    case "findings":
      return slide.pageCount > 1
        ? `Key Findings (${slide.pageIndex + 1} of ${slide.pageCount})`
        : "Key Findings";
    case "qa":
      return "Q&A";
    case "appendix":
      return slide.pageCount > 1
        ? `Appendix: Selected Q&A (${slide.pageIndex + 1} of ${slide.pageCount})`
        : "Appendix: Selected Q&A";
  }
}

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
  const included = includedItems(session);
  const all = session.qaItems;

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

  // 3) Interviewee summary
  const fileNames = session.uploadedFiles.map((f) => f.fileName);
  const fileLines = fileNames.slice(0, 4);
  if (fileNames.length > 4) {
    fileLines.push(`and ${fileNames.length - 4} more files`);
  }
  slides.push({
    kind: "summary",
    intervieweeName: session.intervieweeName?.trim() || UNKNOWN_INTERVIEWEE,
    interviewDate: formatDate(session.interviewDate) || "Not specified",
    extractionDate: formatDate(session.createdAt) || "Not specified",
    fileLines,
    totalQA: all.length,
    highCount: all.filter((q) => q.importance === "High").length,
    mediumCount: all.filter((q) => q.importance === "Medium").length,
    lowCount: all.filter((q) => q.importance === "Low").length,
    includedCount: included.length,
  });

  // 4) Key findings: High-importance included items first. If no High items
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
    });
  });

  // 5) Q&A slides, two items per slide, orderIndex order
  chunk(included, QA_PER_SLIDE).forEach((page) => {
    slides.push({
      kind: "qa",
      items: page.map((q) => {
        const citation = options.includeCitations ? q.sourceCitations[0] : undefined;
        return {
          question: truncate(oneLine(q.question), 200),
          answer: truncate(q.answer.trim(), 420),
          importance: q.importance,
          citation: citation
            ? {
                fileName: citation.fileName,
                quote: truncate(oneLine(citation.quote), 80),
              }
            : undefined,
        };
      }),
    });
  });

  // 6) Appendix: compact numbered list of all included questions
  if (options.includeAppendix && included.length > 0) {
    const numbered = included.map((q, i) => ({
      number: i + 1,
      question: truncate(oneLine(q.question), 120),
    }));
    const appendixPages = chunk(numbered, APPENDIX_PER_SLIDE);
    appendixPages.forEach((page, pageIndex) => {
      slides.push({
        kind: "appendix",
        items: page,
        pageIndex,
        pageCount: appendixPages.length,
      });
    });
  }

  return slides;
}
