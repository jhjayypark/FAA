"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon } from "@hugeicons/core-free-icons";
import type { FNSLocation } from "@/lib/types";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Map popup for an FNS location. Uses the keyless Google Maps embed
 * (no API key required); the footer link opens the full Google Maps app.
 */
export function LocationMapDialog({
  location,
  onOpenChange,
}: {
  location: FNSLocation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const query = location ? encodeURIComponent(`${location.name}, ${location.address}`) : "";
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    location?.address ?? ""
  )}&z=15&output=embed`;
  const externalHref = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <Dialog open={location !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[min(44rem,calc(100%-2rem))]">
        {location && (
          <>
            <DialogHeader>
              <DialogTitle>{location.name}</DialogTitle>
              <DialogDescription>{location.address}</DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-md border border-border bg-muted">
              <iframe
                key={location.id}
                src={embedSrc}
                title={location.name}
                className="aspect-[4/3] w-full sm:aspect-video"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <a href={externalHref} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={Link01Icon} size={14} strokeWidth={1.8} />
                  {t("common.map.openExternal")}
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
