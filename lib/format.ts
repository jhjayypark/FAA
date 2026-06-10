/** Shared formatting helpers. Locale follows the interface-language setting. */

export type FormatLocale = "en-US" | "ko-KR";

let activeLocale: FormatLocale = "en-US";

/** Wired from the i18n layer; keeps dates in step with the UI language. */
export function setFormatLocale(locale: FormatLocale): void {
  activeLocale = locale;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  // Date-only strings must be parsed as local dates; new Date("yyyy-mm-dd")
  // would treat them as UTC midnight and shift a day in western timezones.
  const dateOnly = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(activeLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(activeLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const minutes = Math.floor(diff / 60000);
  const ko = activeLocale === "ko-KR";
  if (minutes < 1) return ko ? "방금 전" : "just now";
  if (minutes < 60) return ko ? `${minutes}분 전` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ko ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return ko ? `${days}일 전` : `${days}d ago`;
  return formatDate(iso);
}

export function charCount(text: string): string {
  return activeLocale === "ko-KR"
    ? `${text.length.toLocaleString("ko-KR")}자`
    : `${text.length.toLocaleString("en-US")} chars`;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

export function fileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
