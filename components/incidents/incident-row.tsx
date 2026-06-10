"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import type { FNSLocation, Incident } from "@/lib/types";
import { useAllLocations, useFAAStore, locationById } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { formatDate, formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_VISIBLE_LOCATIONS = 3;

/** One incident row inside the bordered incidents list. */
export function IncidentRow({ incident }: { incident: Incident }) {
  const t = useT();
  const router = useRouter();
  const allLocations = useAllLocations();
  const deleteIncident = useFAAStore((s) => s.deleteIncident);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const href = `/incidents/${incident.id}`;
  const locations = incident.involvedLocationIds
    .map((id) => locationById(allLocations, id))
    .filter((l): l is FNSLocation => Boolean(l));
  const visibleLocations = locations.slice(0, MAX_VISIBLE_LOCATIONS);
  const hiddenCount = locations.length - visibleLocations.length;
  const sessionCount = incident.interviewSessions.length;

  function handleDelete() {
    deleteIncident(incident.id);
    toast.success(t("incidents.toast.deleted"));
  }

  return (
    <div
      className="group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/40 md:flex-row md:items-center md:gap-4"
      onClick={() => router.push(href)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {incident.name}
          </Link>
          {visibleLocations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex max-w-44 items-center truncate rounded border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {loc.name}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {t("incidents.row.moreLocations", { count: hiddenCount })}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-muted-foreground">
          <span>
            {t("incidents.row.created", { date: formatDate(incident.createdAt) })}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {sessionCount === 1
              ? t("incidents.row.sessions.one", { count: sessionCount })
              : t("incidents.row.sessions.many", { count: sessionCount })}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t("incidents.row.updated", {
              time: formatRelative(incident.updatedAt),
            })}
          </span>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 self-end md:self-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{t("common.open")}</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("incidents.row.actions")}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={14} strokeWidth={1.8} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
              {t("incidents.row.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("incidents.delete.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("incidents.delete.description", { name: incident.name })}
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
    </div>
  );
}
