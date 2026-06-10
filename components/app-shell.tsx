"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  FolderDetailsIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/assistant", label: "Assistant", icon: BubbleChatIcon },
  { href: "/incidents", label: "Incidents", icon: FolderDetailsIcon },
];

function FAAWordmark() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary">
        <span className="font-mono text-[13px] font-bold tracking-tight text-primary-foreground">
          FAA
        </span>
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold tracking-tight text-foreground">
          FNS Audit Assistant
        </div>
        <div className="text-[11px] text-muted-foreground">Internal Audit, FNS Inc.</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-2 pt-5 pb-4">
          <FAAWordmark />
        </div>
        <NavLinks />
        <div className="mt-auto px-4 pb-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Audit materials stay in this browser. Confidential: internal use only.
          </p>
        </div>
      </aside>

      {/* Mobile shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-sidebar px-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.8} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-2 pt-5 pb-4">
                <FAAWordmark />
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <FAAWordmark />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
