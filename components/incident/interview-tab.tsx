"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiMagicIcon,
  ClipboardIcon,
  Delete02Icon,
  Mic01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import type { Incident, InterviewSession } from "@/lib/types";
import { useFAAStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function SessionRow({
  incidentId,
  session,
}: {
  incidentId: string;
  session: InterviewSession;
}) {
  const t = useT();
  const deleteInterviewSession = useFAAStore((s) => s.deleteInterviewSession);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileCount = session.uploadedFiles.length;
  const qaCount = session.qaItems.length;
  const highCount = session.qaItems.filter(
    (qa) => qa.importance === "High"
  ).length;
  const name =
    session.intervieweeName?.trim() || t("incidentDetail.unknownInterviewee");

  const handleDelete = () => {
    deleteInterviewSession(incidentId, session.id);
    toast.success(t("incidentDetail.toast.sessionDeleted"));
  };

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {formatDate(session.createdAt)} ·{" "}
          {t(
            fileCount === 1
              ? "incidentDetail.session.files.one"
              : "incidentDetail.session.files.many",
            { count: fileCount }
          )}{" "}
          · {t("incidentDetail.session.qaCount", { count: qaCount })} ·{" "}
          {t("incidentDetail.session.highCount", { count: highCount })}
        </p>
      </div>

      <Button variant="outline" asChild className="shrink-0">
        <Link href={`/incidents/${incidentId}/sessions/${session.id}`}>
          {t("common.open")}
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("incidentDetail.session.rowActions")}
            className="shrink-0 text-muted-foreground"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={15} strokeWidth={1.8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmDelete(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("incidentDetail.deleteSession.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("incidentDetail.deleteSession.description", { name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function InterviewTab({ incident }: { incident: Incident }) {
  const t = useT();
  const sessions = incident.interviewSessions;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon
                icon={ClipboardIcon}
                size={18}
                strokeWidth={1.8}
                className="text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-muted-foreground">
                {t("incidentDetail.prepare.title")}
              </CardTitle>
              <Badge variant="secondary">
                {t("incidentDetail.prepare.comingSoon")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("incidentDetail.prepare.description")}
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button variant="outline" disabled>
              {t("incidentDetail.prepare.action")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-1 flex size-9 items-center justify-center rounded-md bg-primary/10">
              <HugeiconsIcon
                icon={AiMagicIcon}
                size={18}
                strokeWidth={1.8}
                className="text-primary"
              />
            </div>
            <CardTitle>{t("incidentDetail.extract.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("incidentDetail.extract.description")}
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild>
              <Link href={`/incidents/${incident.id}/extract`}>
                {t("incidentDetail.extract.action")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">
            {t("incidentDetail.sessions.title")}
          </h2>
          {sessions.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              {sessions.length}
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-border px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon
                icon={Mic01Icon}
                size={18}
                strokeWidth={1.8}
                className="text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-sm font-semibold">
              {t("incidentDetail.sessions.emptyTitle")}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("incidentDetail.sessions.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                incidentId={incident.id}
                session={session}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
