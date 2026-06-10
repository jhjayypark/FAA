"use client";

import { use, useState } from "react";
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
          <h2 className="text-sm font-semibold">Incident not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This incident may have been deleted or the link is incorrect.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/incidents">Back to incidents</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ExtractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
            toast.error(`Could not read ${file.name}.`);
          }
        })
        .finally(() => {
          setParsingFiles((prev) => prev.filter((p) => p.key !== key));
        });
    });
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
    const settings: ExtractionSettings = {
      stylePreset: "strict_factual",
      importantOnly,
      rules: [...MANDATORY_EXTRACTION_RULES],
    };
    setStep("running");
    setStage(PIPELINE_STAGES[0]);
    setPercent(0);
    setErrorMessage(null);
    try {
      const result = await extractInterviewInsights({
        incident,
        overviewEntries: incident.overviewEntries,
        uploadedFiles: files,
        settings,
        onProgress: (s, p) => {
          setStage(s);
          setPercent(p);
        },
      });
      if (result.qaItems.length === 0) {
        setStep("empty");
        return;
      }
      const session = addInterviewSession(incident.id, {
        intervieweeName: result.intervieweeName ?? undefined,
        interviewDate: undefined,
        uploadedFiles: files,
        extractionSettings: settings,
        qaItems: result.qaItems.map((q, i) => ({
          ...q,
          id: newId(),
          orderIndex: i,
          isManuallyEdited: false,
        })),
      });
      toast.success("Extraction complete.");
      router.replace(`/incidents/${id}/sessions/${session.id}`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setStep("error");
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
          Extract Interview Insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload interview material, confirm extraction rules, and generate cited Q&A
          findings.
        </p>
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
            onRetry={startExtraction}
            onBackToFiles={() => setStep("upload")}
          />
        )}
      </div>
    </div>
  );
}
