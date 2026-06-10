import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Korean content (interview outputs, assistant answers) renders through this
// fallback since Geist has no Hangul glyphs.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FAA | FNS Audit Assistant",
  description:
    "Internal audit workspace for FNS, Inc. Manage incidents, extract interview findings, and build report-ready insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        notoSansKr.variable
      )}
    >
      <body className="h-full overflow-hidden">
        <AppShell>{children}</AppShell>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
