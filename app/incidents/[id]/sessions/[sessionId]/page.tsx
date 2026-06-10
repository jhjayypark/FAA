"use client";

import { use, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FileSearchIcon } from "@hugeicons/core-free-icons";
import type { Importance, QAItem } from "@/lib/types";
import { useHydrated, useIncident } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionHeader } from "@/components/results/session-header";
import { ResultsToolbar, type SortMode } from "@/components/results/results-toolbar";
import { QACard } from "@/components/results/qa-card";
import { SourceViewer } from "@/components/results/source-viewer";
import { ReportDialog } from "@/components/report/report-dialog";

const IMPORTANCE_RANK: Record<Importance, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/**
 * Sorting never mutates orderIndex or the stored array: importance sorts are
 * stable by rank, then by the original orderIndex.
 */
function sortQAItems(items: QAItem[], sort: SortMode): QAItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "time") return a.orderIndex - b.orderIndex;
    const diff = IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
    const directional = sort === "importance-desc" ? diff : -diff;
    return directional !== 0 ? directional : a.orderIndex - b.orderIndex;
  });
  return copy;
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-5 h-3 w-24" />
      <Skeleton className="mt-2.5 h-7 w-48" />
      <Skeleton className="mt-2.5 h-3.5 w-72" />
      <div className="mt-6 flex items-center gap-4 border-b pb-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-44" />
        <div className="ml-auto hidden gap-2 sm:flex">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
      <div className="mt-5 max-w-4xl space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="h-4 w-14" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2.5 h-4 w-full" />
            <Skeleton className="mt-2.5 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotFoundState({ incidentId }: { incidentId?: string }) {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <HugeiconsIcon
          icon={FileSearchIcon}
          size={28}
          strokeWidth={1.5}
          className="text-muted-foreground"
        />
        <h1 className="mt-3 text-sm font-semibold">
          {t("results.notFound.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("results.notFound.description")}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link
            href={
              incidentId ? `/incidents/${incidentId}?tab=interview` : "/incidents"
            }
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.8} />
            {incidentId
              ? t("results.notFound.back")
              : t("results.notFound.backAll")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptySessionState({ incidentId }: { incidentId: string }) {
  const t = useT();
  return (
    <div className="mt-5 flex max-w-4xl flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center">
      <HugeiconsIcon
        icon={FileSearchIcon}
        size={26}
        strokeWidth={1.5}
        className="text-muted-foreground"
      />
      <h2 className="mt-3 text-sm font-semibold">{t("results.empty.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("results.empty.description")}
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href={`/incidents/${incidentId}?tab=interview`}>
          {t("results.notFound.back")}
        </Link>
      </Button>
    </div>
  );
}

export default function SessionResultsPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = use(params);
  const hydrated = useHydrated();
  const incident = useIncident(id);
  const session = incident?.interviewSessions.find((s) => s.id === sessionId);

  const [sort, setSort] = useState<SortMode>("time");
  const [importantOnly, setImportantOnly] = useState(false);
  const [viewerQAId, setViewerQAId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  if (!hydrated) {
    return <PageSkeleton />;
  }

  if (!incident || !session) {
    return <NotFoundState incidentId={incident ? id : undefined} />;
  }

  const sortedItems = sortQAItems(session.qaItems, sort);
  const includedCount = session.qaItems.filter((q) => q.includedInReport).length;
  const viewerItem = viewerQAId
    ? session.qaItems.find((q) => q.id === viewerQAId) ?? null
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <SessionHeader incidentId={id} session={session} />

      <div className="mt-6">
        <ResultsToolbar
          sort={sort}
          onSortChange={setSort}
          importantOnly={importantOnly}
          onImportantOnlyChange={setImportantOnly}
          includedCount={includedCount}
          totalCount={session.qaItems.length}
          onGeneratePptx={() => setReportOpen(true)}
        />

        {session.qaItems.length === 0 ? (
          <EmptySessionState incidentId={id} />
        ) : (
          <div className="mt-5 max-w-4xl space-y-3">
            {sortedItems.map((item) => (
              <QACard
                key={item.id}
                incidentId={id}
                sessionId={sessionId}
                item={item}
                dimmed={importantOnly && item.importance === "Low"}
                onViewSource={setViewerQAId}
              />
            ))}
          </div>
        )}
      </div>

      <SourceViewer
        session={session}
        item={viewerItem}
        open={viewerItem !== null}
        onOpenChange={(open) => {
          if (!open) setViewerQAId(null);
        }}
      />

      <ReportDialog
        incident={incident}
        sessions={[session]}
        scope="session"
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  );
}
