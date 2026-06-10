"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import type { Incident } from "@/lib/types";
import { locationById, useAllLocations } from "@/lib/store";
import { formatDate, formatRelative } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ContextPanel({ context }: { context: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) return;
    const el = textRef.current;
    if (!el) return;
    setClampable(el.scrollHeight > el.clientHeight + 1);
  }, [context, expanded]);

  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Context
      </p>
      <p
        ref={textRef}
        className={
          expanded
            ? "mt-1.5 whitespace-pre-wrap text-sm text-foreground"
            : "mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-foreground"
        }
      >
        {context}
      </p>
      {(clampable || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-primary transition-colors duration-150 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function IncidentHeader({ incident }: { incident: Incident }) {
  const allLocations = useAllLocations();
  const locations = incident.involvedLocationIds
    .map((id) => locationById(allLocations, id))
    .filter((loc): loc is NonNullable<typeof loc> => loc != null);

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/incidents"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={1.8} />
        Incidents
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">{incident.name}</h1>

      {locations.length > 0 && (
        <TooltipProvider>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((loc) => (
              <Tooltip key={loc.id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-foreground">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={12}
                      strokeWidth={1.8}
                      className="text-muted-foreground"
                    />
                    {loc.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{loc.address}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      <p className="font-mono text-xs text-muted-foreground">
        Created {formatDate(incident.createdAt)} · Updated{" "}
        {formatRelative(incident.updatedAt)}
      </p>

      {incident.context && incident.context.trim().length > 0 && (
        <ContextPanel context={incident.context} />
      )}
    </div>
  );
}
