"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  FolderDetailsIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useFAAStore } from "@/lib/store";
import { useLanguage, useT } from "@/lib/i18n";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings-dialog";

const NAV_ITEMS = [
  { href: "/assistant", labelKey: "common.nav.assistant", icon: BubbleChatIcon },
  { href: "/incidents", labelKey: "common.nav.incidents", icon: FolderDetailsIcon },
];

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // Korean names render best with the family-name character alone.
  if (/^[가-힣]/.test(trimmed)) return trimmed[0];
  const parts = trimmed.split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function FAAWordmark() {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary">
        <span className="font-mono text-[13px] font-bold tracking-tight text-primary-foreground">
          FAA
        </span>
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold tracking-tight text-foreground">
          {t("common.appName")}
        </div>
        <div className="text-[11px] text-muted-foreground">{t("common.orgLine")}</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <HugeiconsIcon
              icon={item.icon}
              size={17}
              strokeWidth={1.8}
              className={cn(active ? "text-primary" : "text-muted-foreground")}
            />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileSection({ onOpenSettings }: { onOpenSettings: () => void }) {
  const t = useT();
  const displayName = useFAAStore((s) => s.settings.displayName);
  return (
    <button
      type="button"
      onClick={onOpenSettings}
      aria-label={t("common.profile.open")}
      className="mx-2 mb-3 flex items-center gap-2.5 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/70"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
        {initialsOf(displayName)}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[13px] font-medium text-foreground">
          {displayName || "..."}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {t("common.profile.role")}
        </span>
      </span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useT();
  const language = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-2 pt-5 pb-4">
          <FAAWordmark />
        </div>
        <NavLinks />
        <div className="mt-auto">
          <ProfileSection onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-sidebar px-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("common.nav.open")}>
                <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.8} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-2 pt-5 pb-4">
                <FAAWordmark />
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="mt-auto">
                <ProfileSection
                  onOpenSettings={() => {
                    setMobileOpen(false);
                    setSettingsOpen(true);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
          <FAAWordmark />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <footer className="shrink-0 border-t bg-background px-6 py-2.5">
          <p className="text-center text-[11px] text-muted-foreground">
            {t("common.footer.confidential")}
          </p>
        </footer>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
