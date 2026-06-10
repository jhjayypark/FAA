"use client";

import type PptxGenJS from "pptxgenjs";
import type { Importance, Incident, InterviewSession, ReportOptions } from "@/lib/types";
import { FNS_LOCATIONS } from "@/lib/locations";
import { useFAAStore } from "@/lib/store";
import {
  buildSlideModels,
  slideHeading,
  type ReportSlide,
} from "@/components/report/slide-model";

const PAGE_W = 13.33;
const PAGE_H = 7.5;
const MARGIN_X = 0.6;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const TEXT_DARK = "1F2937";
const TEXT_MUTED = "6B7280";
const DIVIDER = "E5E7EB";
const KOREAN_FONT = "Malgun Gothic";
const MONO_FONT = "Consolas";

const CHIP_COLORS: Record<Importance, string> = {
  High: "B4232A",
  Medium: "B8860B",
  Low: "6B7280",
};

function resolveLocationNames(incident: Incident): string[] {
  const all = [...FNS_LOCATIONS, ...useFAAStore.getState().customLocations];
  return incident.involvedLocationIds
    .map((id) => all.find((loc) => loc.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

function sanitizeFileName(raw: string): string {
  const cleaned = raw
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "FAA_report";
}

function addSlideNumber(slide: PptxGenJS.Slide, n: number): void {
  slide.addText(String(n), {
    x: PAGE_W - 1.0,
    y: PAGE_H - 0.42,
    w: 0.7,
    h: 0.3,
    fontSize: 9,
    color: TEXT_MUTED,
    align: "right",
    fontFace: MONO_FONT,
  });
}

function addHeader(pptx: PptxGenJS, slide: PptxGenJS.Slide, heading: string, themeHex: string): void {
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN_X,
    y: 0.55,
    w: 0.5,
    h: 0.12,
    fill: { color: themeHex },
  });
  slide.addText(heading, {
    x: MARGIN_X,
    y: 0.74,
    w: CONTENT_W,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: TEXT_DARK,
    fontFace: KOREAN_FONT,
    valign: "top",
  });
}

function addChip(
  slide: PptxGenJS.Slide,
  importance: Importance,
  x: number,
  y: number
): void {
  slide.addText(importance.toUpperCase(), {
    x,
    y,
    w: 0.95,
    h: 0.3,
    fontSize: 9,
    bold: true,
    color: "FFFFFF",
    fill: { color: CHIP_COLORS[importance] },
    align: "center",
    valign: "middle",
    fontFace: "Arial",
  });
}

function renderSlide(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  model: ReportSlide,
  options: ReportOptions,
  themeHex: string
): void {
  if (model.kind === "cover") {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.45,
      h: PAGE_H,
      fill: { color: themeHex },
    });
    slide.addText(model.title, {
      x: 1.0,
      y: 2.0,
      w: 11.4,
      h: 1.3,
      fontSize: 32,
      bold: true,
      color: TEXT_DARK,
      fontFace: KOREAN_FONT,
      valign: "bottom",
    });
    slide.addText(model.incidentName, {
      x: 1.0,
      y: 3.4,
      w: 11.4,
      h: 0.5,
      fontSize: 18,
      color: TEXT_MUTED,
      fontFace: KOREAN_FONT,
      valign: "top",
    });
    slide.addText(`Generated ${model.generatedOn}`, {
      x: 1.0,
      y: 3.95,
      w: 11.4,
      h: 0.35,
      fontSize: 12,
      color: TEXT_MUTED,
      fontFace: MONO_FONT,
      valign: "top",
    });
    if (model.locationNames.length > 0) {
      slide.addText(model.locationNames.join(", "), {
        x: 1.0,
        y: 4.5,
        w: 11.4,
        h: 0.9,
        fontSize: 11,
        color: TEXT_MUTED,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
    }
    slide.addText("FAA / FNS Audit Assistant", {
      x: 1.0,
      y: 6.95,
      w: 5.0,
      h: 0.35,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: "Arial",
      valign: "middle",
    });
    return;
  }

  addHeader(pptx, slide, slideHeading(model), themeHex);

  if (model.kind === "context") {
    slide.addText(model.body, {
      x: MARGIN_X,
      y: 1.5,
      w: CONTENT_W,
      h: 5.4,
      fontSize: 14,
      color: TEXT_DARK,
      fontFace: KOREAN_FONT,
      valign: "top",
    });
    return;
  }

  if (model.kind === "summary") {
    const stats: Array<[string, string]> = [
      ["INTERVIEWEE", model.intervieweeName],
      ["INTERVIEW DATE", model.interviewDate],
      ["EXTRACTION DATE", model.extractionDate],
      ["TOTAL Q&A", String(model.totalQA)],
      [
        "IMPORTANCE SPLIT",
        `${model.highCount} High / ${model.mediumCount} Medium / ${model.lowCount} Low`,
      ],
      ["IN REPORT", `${model.includedCount} of ${model.totalQA}`],
    ];
    stats.forEach(([label, value], i) => {
      const x = MARGIN_X + (i % 3) * 4.2;
      const y = 1.55 + Math.floor(i / 3) * 1.2;
      slide.addText(label, {
        x,
        y,
        w: 4.0,
        h: 0.3,
        fontSize: 9,
        color: TEXT_MUTED,
        fontFace: "Arial",
        valign: "top",
      });
      slide.addText(value, {
        x,
        y: y + 0.3,
        w: 4.0,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: TEXT_DARK,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
    });
    slide.addText("SOURCE FILES", {
      x: MARGIN_X,
      y: 4.3,
      w: CONTENT_W,
      h: 0.3,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: "Arial",
      valign: "top",
    });
    if (model.fileLines.length > 0) {
      slide.addText(model.fileLines.join("\n"), {
        x: MARGIN_X,
        y: 4.62,
        w: CONTENT_W,
        h: 2.1,
        fontSize: 12,
        color: TEXT_DARK,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
    } else {
      slide.addText("No source files", {
        x: MARGIN_X,
        y: 4.62,
        w: CONTENT_W,
        h: 0.4,
        fontSize: 12,
        color: TEXT_MUTED,
        fontFace: "Arial",
        valign: "top",
      });
    }
    return;
  }

  if (model.kind === "findings") {
    const startY = 1.5;
    const itemH = 1.08;
    model.items.forEach((item, i) => {
      const y = startY + i * itemH;
      let questionX = MARGIN_X;
      if (options.includeImportanceBadges) {
        addChip(slide, item.importance, MARGIN_X, y + 0.05);
        questionX = MARGIN_X + 1.1;
      }
      slide.addText(item.question, {
        x: questionX,
        y,
        w: PAGE_W - questionX - MARGIN_X,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: TEXT_DARK,
        fontFace: KOREAN_FONT,
        valign: "middle",
      });
      slide.addText(item.answerExcerpt, {
        x: questionX,
        y: y + 0.42,
        w: PAGE_W - questionX - MARGIN_X,
        h: 0.45,
        fontSize: 12,
        color: TEXT_MUTED,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
    });
    return;
  }

  if (model.kind === "qa") {
    model.items.forEach((item, i) => {
      const y0 = 1.4 + i * 2.95;
      if (i > 0) {
        slide.addShape(pptx.ShapeType.rect, {
          x: MARGIN_X,
          y: y0 - 0.18,
          w: CONTENT_W,
          h: 0.01,
          fill: { color: DIVIDER },
        });
      }
      const questionW = options.includeImportanceBadges ? CONTENT_W - 1.1 : CONTENT_W;
      slide.addText(`Q. ${item.question}`, {
        x: MARGIN_X,
        y: y0,
        w: questionW,
        h: 0.75,
        fontSize: 15,
        bold: true,
        color: TEXT_DARK,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
      if (options.includeImportanceBadges) {
        addChip(slide, item.importance, PAGE_W - MARGIN_X - 0.95, y0);
      }
      slide.addText(`A. ${item.answer}`, {
        x: MARGIN_X,
        y: y0 + 0.8,
        w: CONTENT_W,
        h: item.citation ? 1.45 : 1.8,
        fontSize: 12,
        color: TEXT_DARK,
        fontFace: KOREAN_FONT,
        valign: "top",
      });
      if (item.citation) {
        slide.addText(`출처: ${item.citation.fileName}, "${item.citation.quote}"`, {
          x: MARGIN_X,
          y: y0 + 2.32,
          w: CONTENT_W,
          h: 0.3,
          fontSize: 10,
          color: TEXT_MUTED,
          fontFace: KOREAN_FONT,
          valign: "top",
        });
      }
    });
    return;
  }

  // Appendix
  model.items.forEach((item, i) => {
    const y = 1.45 + i * 0.62;
    slide.addText(`${item.number}.`, {
      x: MARGIN_X,
      y,
      w: 0.5,
      h: 0.55,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: MONO_FONT,
      valign: "top",
    });
    slide.addText(item.question, {
      x: MARGIN_X + 0.55,
      y,
      w: CONTENT_W - 0.55,
      h: 0.55,
      fontSize: 12,
      color: TEXT_DARK,
      fontFace: KOREAN_FONT,
      valign: "top",
    });
  });
}

/**
 * Builds the PPTX from the same slide model used by the HTML preview and
 * triggers a browser download. Throws on failure; callers surface a toast.
 */
export async function generatePptx({
  incident,
  session,
  options,
}: {
  incident: Incident;
  session: InterviewSession;
  options: ReportOptions;
}): Promise<void> {
  const PptxGenJSCtor = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJSCtor();

  pptx.defineLayout({ name: "WIDE", width: PAGE_W, height: PAGE_H });
  pptx.layout = "WIDE";
  pptx.title = options.title;
  pptx.author = "FAA / FNS Audit Assistant";

  const themeHex = options.themeColor.replace(/^#/, "").toUpperCase();
  const slides = buildSlideModels({
    incident,
    session,
    options,
    locationNames: resolveLocationNames(incident),
  });

  slides.forEach((model, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    renderSlide(pptx, slide, model, options, themeHex);
    addSlideNumber(slide, index + 1);
  });

  const fileName = `${sanitizeFileName(`FAA_${incident.name}_findings`)}.pptx`;
  await pptx.writeFile({ fileName });
}
