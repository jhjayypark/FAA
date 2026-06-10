import { NextResponse } from "next/server";

/**
 * Imports interview material from a public share link, server-side (the
 * browser cannot fetch these cross-origin).
 *
 * Supported:
 * - Plaud share links (web.plaud.ai/s/... or /nshare/...): fetches the
 *   share API and rebuilds a speaker-labeled transcript with timestamps.
 * - Generic pages: falls back to stripping HTML to plain text. JS-rendered
 *   apps will not yield useful text and return a clear error instead.
 *
 * The fetched content is returned to the client and stored only in the
 * browser (localStorage), never persisted server-side.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;

type PlaudSegment = {
  content?: string;
  speaker?: string;
  original_speaker?: string;
  start_time?: number;
};

function msToClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Conservative SSRF guard: public http(s) hosts only. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || a === 169) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (h.includes(":")) return true; // IPv6 literals
  return false;
}

async function fetchWithLimit(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { accept, "user-agent": "FAA-AuditAssistant/1.0 (+link import)" },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

function plaudShareId(url: URL): string | null {
  if (!/(^|\.)plaud\.ai$/.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/(?:s|nshare)\/(.+)$/);
  return m ? m[1] : null;
}

async function importPlaud(shareId: string) {
  const res = await fetchWithLimit(
    `https://api.plaud.ai/share/access/${shareId}`,
    "application/json"
  );
  if (!res.ok) {
    throw new Error(`Plaud share API responded ${res.status}`);
  }
  const data = await res.json();
  const file = data?.data_file;
  if (!file) throw new Error("Plaud share has no file data");

  const segments: PlaudSegment[] = Array.isArray(file.trans_result) && file.trans_result.length > 0
    ? file.trans_result
    : Array.isArray(file.transaction_polish)
      ? file.transaction_polish
      : [];
  if (segments.length === 0) {
    throw new Error("Plaud share contains no transcript");
  }

  // Merge consecutive same-speaker segments into single turns.
  type Turn = { speaker: string; time: number; parts: string[] };
  const turns: Turn[] = [];
  for (const seg of segments) {
    const content = (seg.content ?? "").trim();
    if (!content) continue;
    const speaker = (seg.speaker || seg.original_speaker || "Speaker").trim();
    const last = turns[turns.length - 1];
    if (last && last.speaker === speaker) {
      last.parts.push(content);
    } else {
      turns.push({ speaker, time: seg.start_time ?? 0, parts: [content] });
    }
  }

  const title: string = (file.filename ?? "Plaud transcript").trim();
  const lines: string[] = [];
  lines.push(`면담 대상: ${title}`);
  if (typeof file.start_time === "number") {
    const d = new Date(file.start_time);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      lines.push(
        `일시: ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }
  }
  lines.push("");
  for (const turn of turns) {
    lines.push(`${turn.speaker}: (${msToClock(turn.time)}) ${turn.parts.join(" ")}`);
  }

  return {
    fileName: `${title} (Plaud)`,
    contentText: lines.join("\n"),
    sourceType: "transcript" as const,
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>(?=.)/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

async function importGeneric(url: URL) {
  const res = await fetchWithLimit(url.toString(), "text/html,text/plain;q=0.9,*/*;q=0.5");
  if (!res.ok) throw new Error(`Link responded ${res.status}`);
  const raw = await res.text();
  if (raw.length > MAX_BYTES) throw new Error("Linked document is too large");

  const contentType = res.headers.get("content-type") ?? "";
  const text = contentType.includes("text/plain") ? raw.trim() : htmlToText(raw);
  if (text.length < 200) {
    throw new Error(
      "Could not extract readable text from this link. The page may require login or render its content with JavaScript."
    );
  }
  const titleMatch = raw.match(/<title[^>]*>([^<]*)<\/title>/i);
  return {
    fileName: titleMatch?.[1]?.trim() || url.hostname,
    contentText: text,
    sourceType: "unknown" as const,
  };
}

export async function POST(req: Request) {
  let url: URL;
  try {
    const body = await req.json();
    url = new URL(String(body?.url ?? ""));
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  if (!/^https?:$/.test(url.protocol) || isBlockedHost(url.hostname)) {
    return NextResponse.json({ error: "Unsupported URL." }, { status: 400 });
  }

  try {
    const shareId = plaudShareId(url);
    const result = shareId ? await importPlaud(shareId) : await importGeneric(url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch the link.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
