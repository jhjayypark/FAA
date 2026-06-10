"use client";

import { Suspense, use, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { useHydrated, useIncident } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentHeader } from "@/components/incident/incident-header";
import { OverviewTab } from "@/components/incident/overview-tab";
import { InterviewTab } from "@/components/incident/interview-tab";

function IncidentDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-72 max-w-full" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

function IncidentNotFound() {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-col items-center gap-2 rounded-md border border-border px-6 py-20 text-center">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={18}
            strokeWidth={1.8}
            className="text-muted-foreground"
          />
        </div>
        <p className="mt-1 text-sm font-semibold">
          {t("incidentDetail.notFound.title")}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("incidentDetail.notFound.description")}
        </p>
        <Button variant="outline" asChild className="mt-3">
          <Link href="/incidents">{t("incidentDetail.notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
}

function IncidentDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const incident = useIncident(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const tab = searchParams.get("tab") === "interview" ? "interview" : "overview";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const qs = params.toString();
      router.replace(`/incidents/${id}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [id, router, searchParams]
  );

  if (!hydrated) {
    return <IncidentDetailSkeleton />;
  }

  if (!incident) {
    return <IncidentNotFound />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <IncidentHeader incident={incident} />
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="overview">
              {t("incidentDetail.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="interview">
              {t("incidentDetail.tabs.interview")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-3">
            <OverviewTab incident={incident} />
          </TabsContent>
          <TabsContent value="interview" className="mt-3">
            <InterviewTab incident={incident} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense fallback={<IncidentDetailSkeleton />}>
      <IncidentDetail id={id} />
    </Suspense>
  );
}
