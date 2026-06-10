"use client";

import type { ReportOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImportanceBadge } from "@/components/importance-badge";
import { slideHeading, type ReportSlide } from "@/components/report/slide-model";

/**
 * HTML rendering of the report slide model. Mirrors the PPTX output built in
 * lib/report/generate-pptx.ts, both render from the same ReportSlide[].
 */
export function SlidePreview({
  slides,
  options,
}: {
  slides: ReportSlide[];
  options: ReportOptions;
}) {
  return (
    <div className="flex flex-col gap-4">
      {slides.map((slide, index) => (
        <SlideFrame key={index} number={index + 1}>
          <SlideBody slide={slide} options={options} />
        </SlideFrame>
      ))}
    </div>
  );
}

function SlideFrame({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-white shadow-sm">
      {children}
      <span className="absolute right-2.5 bottom-1.5 font-mono text-[10px] text-muted-foreground">
        {number}
      </span>
    </div>
  );
}

function SlideBody({ slide, options }: { slide: ReportSlide; options: ReportOptions }) {
  const theme = options.themeColor;

  if (slide.kind === "cover") {
    return (
      <div className="flex h-full">
        <div className="h-full w-[3.5%] shrink-0" style={{ backgroundColor: theme }} />
        <div className="relative flex min-w-0 flex-1 flex-col justify-center px-[6%]">
          <h3 className="text-base leading-snug font-semibold tracking-tight text-foreground sm:text-3xl">
            {slide.title}
          </h3>
          <p className="mt-1 truncate text-[11px] text-muted-foreground sm:mt-2 sm:text-base">
            {slide.incidentName}
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground sm:text-xs">
            Generated {slide.generatedOn}
          </p>
          {slide.locationNames.length > 0 && (
            <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-xs">
              {slide.locationNames.join(", ")}
            </p>
          )}
          <p className="absolute bottom-[5%] left-[6%] text-[8px] text-muted-foreground/80 sm:text-[10px]">
            FAA / FNS Audit Assistant
          </p>
        </div>
      </div>
    );
  }

  return (
    <ContentSlide heading={slideHeading(slide)} theme={theme}>
      {slide.kind === "context" && (
        <p className="text-[10px] leading-relaxed whitespace-pre-wrap text-foreground sm:text-sm">
          {slide.body}
        </p>
      )}

      {slide.kind === "summary" && (
        <div className="flex h-full flex-col">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 sm:gap-y-4">
            <Stat label="Interviewee" value={slide.intervieweeName} />
            <Stat label="Interview date" value={slide.interviewDate} />
            <Stat label="Extraction date" value={slide.extractionDate} />
            <Stat label="Total Q&A" value={String(slide.totalQA)} />
            <Stat
              label="Importance split"
              value={`${slide.highCount} High / ${slide.mediumCount} Medium / ${slide.lowCount} Low`}
            />
            <Stat label="In report" value={`${slide.includedCount} of ${slide.totalQA}`} />
          </div>
          <div className="mt-2 min-h-0 sm:mt-5">
            <p className="text-[8px] tracking-wide text-muted-foreground uppercase sm:text-[10px]">
              Source files
            </p>
            {slide.fileLines.length > 0 ? (
              <ul className="mt-0.5 sm:mt-1">
                {slide.fileLines.map((line, i) => (
                  <li
                    key={i}
                    className="truncate font-mono text-[9px] leading-relaxed text-foreground sm:text-xs"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-[9px] text-muted-foreground sm:mt-1 sm:text-xs">
                No source files
              </p>
            )}
          </div>
        </div>
      )}

      {slide.kind === "findings" && (
        <ul className="flex flex-col gap-1.5 sm:gap-3.5">
          {slide.items.map((item, i) => (
            <li key={i} className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {options.includeImportanceBadges && (
                  <ImportanceBadge importance={item.importance} className="shrink-0" />
                )}
                <p className="min-w-0 truncate text-[10px] font-medium text-foreground sm:text-[13px]">
                  {item.question}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[9px] text-muted-foreground sm:text-xs">
                {item.answerExcerpt}
              </p>
            </li>
          ))}
        </ul>
      )}

      {slide.kind === "qa" && (
        <div className="flex h-full flex-col">
          {slide.items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex min-h-0 flex-1 flex-col",
                i > 0 && "mt-1.5 border-t pt-1.5 sm:mt-3 sm:pt-3"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[10px] leading-snug font-semibold text-foreground sm:text-[13px]">
                  <span style={{ color: theme }}>Q.</span> {item.question}
                </p>
                {options.includeImportanceBadges && (
                  <ImportanceBadge importance={item.importance} className="shrink-0" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-3 text-[9px] leading-relaxed text-foreground/90 sm:mt-1.5 sm:line-clamp-4 sm:text-xs">
                <span className="font-semibold" style={{ color: theme }}>
                  A.
                </span>{" "}
                {item.answer}
              </p>
              {item.citation && (
                <p className="mt-auto truncate pt-0.5 text-[8px] text-muted-foreground sm:pt-1 sm:text-[10px]">
                  {`출처: ${item.citation.fileName}, "${item.citation.quote}"`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {slide.kind === "appendix" && (
        <ol className="flex flex-col gap-1 sm:gap-2">
          {slide.items.map((item) => (
            <li key={item.number} className="flex min-w-0 gap-1.5 sm:gap-2">
              <span className="shrink-0 font-mono text-[9px] text-muted-foreground sm:text-xs">
                {item.number}.
              </span>
              <span className="min-w-0 truncate text-[10px] text-foreground sm:text-xs">
                {item.question}
              </span>
            </li>
          ))}
        </ol>
      )}
    </ContentSlide>
  );
}

function ContentSlide({
  heading,
  theme,
  children,
}: {
  heading: string;
  theme: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col px-[5%] py-[4.5%]">
      <div className="shrink-0">
        <div className="h-1 w-8 rounded-sm sm:h-1.5 sm:w-12" style={{ backgroundColor: theme }} />
        <h3 className="mt-1 text-xs font-semibold tracking-tight text-foreground sm:mt-2 sm:text-lg">
          {heading}
        </h3>
      </div>
      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden sm:mt-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] tracking-wide text-muted-foreground uppercase sm:text-[10px]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-foreground sm:text-sm">{value}</p>
    </div>
  );
}
