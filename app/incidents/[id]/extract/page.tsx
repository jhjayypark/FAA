"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import {
  MANDATORY_EXTRACTION_RULES,
  type ExtractionSettings,
  type UploadedFileSourceType,
  type UploadedInterviewFile,
} from "@/lib/types";
import { useFAAStore, useHydrated, useIncident } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fileExtension, newId } from "@/lib/format";
import { FileParseError, parseUploadedFile } from "@/lib/parse-files";
import {
  extractInterviewInsights,
  type ExtractionStage,
} from "@/lib/extraction/extract";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExtractionStepper } from "@/components/extraction/extraction-stepper";
import { UploadStep, type ParsingFile } from "@/components/extraction/upload-step";
import { RulesStep } from "@/components/extraction/rules-step";
import {
  ExtractionProgress,
  PIPELINE_STAGES,
} from "@/components/extraction/extraction-progress";

type FlowStep = "upload" | "rules" | "running" | "empty" | "error";

function guessSourceType(fileName: string): UploadedFileSourceType {
  const lower = fileName.toLowerCase();
  if (lower.includes("노트") || lower.includes("메모") || lower.includes("note")) {
    return "manual_notes";
  }
  if (
    lower.includes("녹취") ||
    lower.includes("transcript") ||
    lower.includes("인터뷰")
  ) {
    return "transcript";
  }
  return "unknown";
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-3 h-7 w-72" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 flex items-center gap-3 border-y border-border py-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="hidden h-4 w-24 sm:block" />
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="hidden h-4 w-14 sm:block" />
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-lg" />
      <Skeleton className="mt-4 h-4 w-64" />
    </div>
  );
}

function NotFoundState() {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-16 text-center">
        <HugeiconsIcon
          icon={FolderOpenIcon}
          size={28}
          strokeWidth={1.5}
          className="text-muted-foreground"
        />
        <div>
          <h2 className="text-sm font-semibold">{t("extraction.notFound.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("extraction.notFound.description")}
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/incidents">{t("extraction.notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ExtractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();
  const hydrated = useHydrated();
  const incident = useIncident(id);
  const addInterviewSession = useFAAStore((s) => s.addInterviewSession);

  const [step, setStep] = useState<FlowStep>("upload");
  const [files, setFiles] = useState<UploadedInterviewFile[]>([]);
  const [parsingFiles, setParsingFiles] = useState<ParsingFile[]>([]);
  const [importantOnly, setImportantOnly] = useState(false);
  const [stage, setStage] = useState<ExtractionStage>(PIPELINE_STAGES[0]);
  const [percent, setPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filteredOutCount, setFilteredOutCount] = useState(0);

  const alive = useRef(true);
  const inFlight = useRef(false);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  function handleAddFiles(selected: File[]) {
    selected.forEach((file) => {
      const key = newId();
      setParsingFiles((prev) => [...prev, { key, fileName: file.name }]);
      parseUploadedFile(file)
        .then((contentText) => {
          setFiles((prev) => [
            ...prev,
            {
              id: newId(),
              fileName: file.name,
              fileType: fileExtension(file.name),
              contentText,
              sourceType: guessSourceType(file.name),
            },
          ]);
        })
        .catch((err: unknown) => {
          if (err instanceof FileParseError) {
            toast.error(err.message);
          } else {
            toast.error(t("extraction.toast.readError", { fileName: file.name }));
          }
        })
        .finally(() => {
          setParsingFiles((prev) => prev.filter((p) => p.key !== key));
        });
    });
  }

  async function handleAddLink(url: string) {
    let hostname: string;
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      hostname = parsed.hostname;
    } catch {
      toast.error(t("extraction.upload.linkInvalid"));
      return;
    }
    const key = newId();
    setParsingFiles((prev) => [...prev, { key, fileName: hostname }]);
    try {
      const res = await fetch("/api/import-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Import failed.");
      }
      // The 일시 header is formatted here, in the auditor's timezone; the
      // serverless route runs in UTC and could shift the interview date.
      let contentText: string = data.contentText;
      if (typeof data.recordedAtMs === "number") {
        const d = new Date(data.recordedAtMs);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          const stamp = `일시: ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          const lines = contentText.split("\n");
          lines.splice(1, 0, stamp);
          contentText = lines.join("\n");
        }
      }
      setFiles((prev) => [
        ...prev,
        {
          id: newId(),
          fileName: data.fileName,
          fileType: "link",
          contentText,
          sourceType: data.sourceType === "transcript" ? "transcript" : "unknown",
        },
      ]);
      toast.success(t("extraction.upload.linkAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("extraction.upload.linkInvalid"));
    } finally {
      setParsingFiles((prev) => prev.filter((p) => p.key !== key));
    }
  }

  function handleSourceTypeChange(fileId: string, sourceType: UploadedFileSourceType) {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, sourceType } : f))
    );
  }

  function handleRemoveFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  async function startExtraction() {
    if (!incident) return;
    if (inFlight.current) return;
    inFlight.current = true;
    const settings: ExtractionSettings = {
      stylePreset: "strict_factual",
      importantOnly,
      rules: [...MANDATORY_EXTRACTION_RULES],
    };
    setStep("running");
    setStage(PIPELINE_STAGES[0]);
    setPercent(0);
    setErrorMessage(null);
    setFilteredOutCount(0);
    try {
      const result = await extractInterviewInsights({
        incident,
        overviewEntries: incident.overviewEntries,
        uploadedFiles: files,
        settings,
        onProgress: (s, p) => {
          if (!alive.current) return;
          setStage(s);
          setPercent(p);
        },
      });
      if (!alive.current) return;
      if (result.qaItems.length === 0) {
        setFilteredOutCount(result.prefilterCount);
        setStep("empty");
        return;
      }
      const session = addInterviewSession(incident.id, {
        intervieweeName: result.intervieweeName ?? undefined,
        interviewDate: result.interviewDate ?? undefined,
        uploadedFiles: files,
        extractionSettings: settings,
        qaItems: result.qaItems.map((q, i) => ({
          ...q,
          id: newId(),
          orderIndex: i,
          isManuallyEdited: false,
        })),
      });
      toast.success(t("extraction.toast.complete"));
      router.replace(`/incidents/${id}/sessions/${session.id}`);
    } catch (err) {
      if (!alive.current) return;
      // Non-Error throws fall back to the translated message in the progress view.
      setErrorMessage(err instanceof Error ? err.message : null);
      setStep("error");
    } finally {
      inFlight.current = false;
    }
  }

  if (!hydrated) return <PageSkeleton />;
  if (!incident) return <NotFoundState />;

  const stepIndex = step === "upload" ? 0 : step === "rules" ? 1 : 2;
  const running = step === "running";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <header>
        {running ? (
          <span
            aria-disabled="true"
            className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground/60"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
            <span className="truncate">{incident.name}</span>
          </span>
        ) : (
          <Link
            href={`/incidents/${id}?tab=interview`}
            className="inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
            <span className="truncate">{incident.name}</span>
          </Link>
        )}
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          {t("extraction.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("extraction.subtitle")}</p>
      </header>

      <div className="mt-6 border-y border-border py-3">
        <ExtractionStepper currentIndex={stepIndex} />
      </div>

      <div className="mt-8">
        {step === "upload" && (
          <UploadStep
            files={files}
            parsingFiles={parsingFiles}
            onAddFiles={handleAddFiles}
            onAddLink={handleAddLink}
            onSourceTypeChange={handleSourceTypeChange}
            onRemoveFile={handleRemoveFile}
            onContinue={() => setStep("rules")}
          />
        )}
        {step === "rules" && (
          <RulesStep
            importantOnly={importantOnly}
            onImportantOnlyChange={setImportantOnly}
            onBack={() => setStep("upload")}
            onExtract={startExtraction}
          />
        )}
        {(step === "running" || step === "empty" || step === "error") && (
          <ExtractionProgress
            status={step}
            stage={stage}
            percent={percent}
            errorMessage={errorMessage}
            filteredOutCount={filteredOutCount}
            onRetry={startExtraction}
            onBackToFiles={() => setStep("upload")}
            onBackToRules={() => setStep("rules")}
          />
        )}
      </div>
    </div>
  );
}
