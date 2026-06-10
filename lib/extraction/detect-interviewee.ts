import type { UploadedInterviewFile } from "@/lib/types";

/** Labels that identify the interviewer side of a transcript. */
export const INTERVIEWER_LABELS = new Set([
  "감사인",
  "감사자",
  "감사팀",
  "조사자",
  "조사관",
  "진행자",
  "질문자",
  "면접관",
  "auditor",
  "interviewer",
  "q",
]);

/** Labels that mark the interviewee side without naming the person. */
const GENERIC_INTERVIEWEE_LABELS = new Set([
  "답변자",
  "대상자",
  "피면담자",
  "피조사자",
  "면담자",
  "직원",
  "interviewee",
  "a",
]);

/** Document-type words that look like names in file names but never are. */
const DOC_WORDS = new Set([
  "녹취록", "녹취", "메모", "노트", "정리", "기록", "회의록", "수기", "파일",
  "내용", "요약", "초안", "최종",
]);

const SPEAKER_LINE = /^\s*([가-힣A-Za-z][가-힣A-Za-z0-9 .]{0,19}?)\s*[::]/;

const HEADER_NAME_PATTERNS = [
  /(?:면담\s*대상자?|인터뷰\s*대상자?|피면담자|대상자|성명|이름)\s*[::]\s*([가-힣]{2,4})/,
];

const FILENAME_PATTERNS = [
  /(?:인터뷰|면담|녹취|메모|노트|transcript|interview|notes?)[_\-\s]*([가-힣]{2,4})/i,
  /([가-힣]{2,4})[_\-\s]*(?:인터뷰|면담|녹취|메모|노트|transcript|interview|notes?)/i,
];

function isInterviewerLabel(label: string): boolean {
  return INTERVIEWER_LABELS.has(label.trim().toLowerCase());
}

function isGenericLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  return GENERIC_INTERVIEWEE_LABELS.has(l) || DOC_WORDS.has(l);
}

const HEADER_DATE_PATTERN =
  /(?:일시|날짜|면담일|인터뷰\s*일자?|면담\s*일자?|date)\s*[::]?\s*(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/i;

/**
 * Detects the interview date (ISO yyyy-mm-dd) from heading lines such as
 * "일시: 2026-06-13 10:00". Returns null when no header date is found.
 */
export function detectInterviewDate(files: UploadedInterviewFile[]): string | null {
  for (const f of files) {
    const head = f.contentText.split(/\r?\n/, 15);
    for (const line of head) {
      const m = line.match(HEADER_DATE_PATTERN);
      if (!m) continue;
      const [, y, mo, d] = m;
      const month = Number(mo);
      const day = Number(d);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;
      return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return null;
}

/**
 * Attempts to detect the interviewee's name from file names, transcript headings,
 * and speaker labels. Returns null when uncertain; the UI then shows
 * "Unknown interviewee" and lets the auditor edit it manually.
 */
export function detectIntervieweeName(files: UploadedInterviewFile[]): string | null {
  // 1. Heading lines near the top of each file: "면담 대상: 김민수" (most reliable)
  for (const f of files) {
    const head = f.contentText.split(/\r?\n/, 15);
    for (const line of head) {
      for (const pattern of HEADER_NAME_PATTERNS) {
        const m = line.match(pattern);
        if (m?.[1] && !isInterviewerLabel(m[1]) && !isGenericLabel(m[1])) return m[1];
      }
    }
  }

  // 2. File names: "김민수_인터뷰.txt", "면담_박지현.docx" ...
  for (const f of files) {
    const base = f.fileName.replace(/\.[^.]+$/, "");
    for (const pattern of FILENAME_PATTERNS) {
      const m = base.match(pattern);
      if (m?.[1] && !isInterviewerLabel(m[1]) && !isGenericLabel(m[1])) return m[1];
    }
  }

  // 3. Most frequent non-interviewer speaker label that looks like a Korean name.
  const counts = new Map<string, number>();
  for (const f of files) {
    for (const line of f.contentText.split(/\r?\n/)) {
      const m = line.match(SPEAKER_LINE);
      if (!m) continue;
      const label = m[1].trim();
      if (isInterviewerLabel(label) || isGenericLabel(label)) continue;
      if (!/^[가-힣]{2,4}$/.test(label)) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 1; // require at least 2 occurrences to be confident
  for (const [label, count] of counts) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
}
