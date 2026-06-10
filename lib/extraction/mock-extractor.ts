/**
 * Heuristic (mock) extraction engine.
 *
 * Produces structured Korean Q&A pairs from interview transcripts and manual
 * notes WITHOUT an LLM. Every extracted answer carries a citation whose
 * quote is an exact substring of the source file with real character offsets,
 * so the source viewer can highlight the precise span.
 *
 * TODO: Replace mock extraction with real LLM provider call (see lib/extraction/extract.ts).
 */

import type {
  ExtractedQAItem,
  ExtractionResult,
  ExtractionSettings,
  Importance,
  Incident,
  OverviewEntry,
  SourceCitation,
  UploadedInterviewFile,
} from "@/lib/types";
import {
  detectInterviewDate,
  detectIntervieweeName,
  INTERVIEWER_LABELS,
} from "@/lib/extraction/detect-interviewee";
import { condenseAnswer, condenseQuestion } from "@/lib/extraction/condense";

type Line = { text: string; start: number; end: number };

type RawQA = {
  question: string;
  answer: string;
  citations: SourceCitation[];
  timestampLabel?: string;
  /** Order of appearance: fileIndex * 10000 + lineIndex, used to keep time order. */
  sortKey: number;
};

const Q_MARKER = /^\s*(?:Q\d*\s*[.:)\]]|질문\s*\d*\s*[.:)]|문\s*[.:)])\s*/i;
const A_MARKER = /^\s*(?:A\d*\s*[.:)\]]|답변?\s*\d*\s*[.:)]|답\s*[.:)])\s*/i;
const SPEAKER_LINE = /^\s*([가-힣A-Za-z][가-힣A-Za-z0-9 .]{0,19}?)\s*[::]\s*/;
const TIMESTAMP = /[\[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]/;
const BULLET = /^\s*[-•*·▶▪]\s+/;
const KEYED_NOTE = /^\s*([가-힣A-Za-z0-9 /]{2,24}?)\s*[::]\s*(.+)$/;

/** Red-flag terms: responsibility, policy violation, concealment, access abuse. */
export const HIGH_KEYWORDS = [
  "횡령", "유용", "착복", "절도", "도난", "분실", "손실", "누락", "폐기",
  "위조", "허위", "조작", "은폐", "무단", "승인 없이", "승인없이", "미승인",
  "결재 없이", "결재없이", "위반", "책임", "지시", "압력", "뇌물", "리베이트",
  "환불", "배상", "클레임", "벌금", "과태료", "소송", "경찰", "신고", "해고",
  "징계", "퇴사", "모순", "은닉", "CCTV", "전표", "비밀번호", "계정", "현금",
  "계좌", "고장",
];

/** Operational context terms: relevant but not red flags on their own. */
export const MEDIUM_KEYWORDS = [
  "절차", "프로세스", "규정", "매뉴얼", "보고", "승인", "결재", "확인", "점검",
  "인수인계", "교육", "시스템", "권한", "담당", "기록", "문서", "월말", "마감",
  "감사", "창고", "출고", "입고", "배송", "운송", "재고", "차이", "불일치",
  "수정", "삭제", "장부", "인보이스", "송장", "출입", "실사",
];

const MONEY = /\d[\d,.]*\s*(?:원|달러|불|USD|KRW)|\$\s?\d[\d,.]*/;
const QUANTITY = /\d[\d,.]*\s*(?:박스|팔레트|개|건|회|%)/;

const STOPWORDS = new Set([
  "있다", "없다", "한다", "있는", "대한", "관련", "그리고", "하지만", "그래서",
  "the", "and", "for", "with", "this", "that", "from",
]);

function splitLines(content: string): Line[] {
  const lines: Line[] = [];
  let start = 0;
  for (const raw of content.split("\n")) {
    lines.push({ text: raw, start, end: start + raw.length });
    start += raw.length + 1; // +1 for the newline
  }
  return lines;
}

/** Exact-substring quote from the source, bounded for display. */
function makeQuote(content: string, start: number, end: number, max = 180): SourceCitation["quote"] {
  const span = content.slice(start, Math.min(end, start + max));
  return span.trimEnd();
}

function citationFor(
  file: UploadedInterviewFile,
  start: number,
  end: number,
  confidence: number
): SourceCitation {
  return {
    fileId: file.id,
    fileName: file.fileName,
    quote: makeQuote(file.contentText, start, end),
    startChar: start,
    endChar: end,
    confidence,
  };
}

const GREETING_SENTENCE =
  /^(안녕하세요|안녕하십니까|반갑습니다|수고\s*많으|바쁘신데|시간\s*내\s*주셔서|감사합니다|오늘\s*(인터뷰|면담)[은는]?|알겠습니다)/;

function cleanQuestion(text: string): string {
  let q = text.replace(Q_MARKER, "").replace(SPEAKER_LINE, "").trim();
  q = q.replace(/\s+/g, " ");

  // Drop greeting/preamble sentences so the actual question leads the card.
  // Only sentences present in the source are kept; nothing is rewritten.
  const sentences = q.split(/(?<=[.?!？])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    const interrogatives = sentences.filter((s) => /[?？]$/.test(s));
    if (interrogatives.length > 0) {
      q = interrogatives.join(" ");
    } else {
      const kept = sentences.filter((s) => !GREETING_SENTENCE.test(s));
      if (kept.length > 0) q = kept.join(" ");
    }
  }

  // Normalize to an interrogative form without inventing meaning:
  // only append "?" when the line clearly reads as a prompt but lacks one.
  if (q && !/[?？]$/.test(q) && /(나요|습니까|입니까|는지|었는지|있는지|해주세요|말씀|설명|알려)/.test(q)) {
    q = `${q}?`;
  }
  return q;
}

function isInterviewer(label: string): boolean {
  return INTERVIEWER_LABELS.has(label.trim().toLowerCase());
}

/** Mode A: explicit "Q: / A:" structured files. */
function extractMarkedQA(file: UploadedInterviewFile, fileIndex: number): RawQA[] {
  const lines = splitLines(file.contentText);
  const items: RawQA[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!Q_MARKER.test(lines[i].text)) {
      i++;
      continue;
    }
    const qLineIdx = i;
    const questionText = lines[i].text;
    const timestamp = questionText.match(TIMESTAMP)?.[1];
    i++;
    // Collect answer block: everything until the next Q marker.
    let answerStart = -1;
    let answerEnd = -1;
    const answerParts: string[] = [];
    while (i < lines.length && !Q_MARKER.test(lines[i].text)) {
      const line = lines[i];
      const trimmed = line.text.trim();
      if (trimmed.length > 0) {
        const contentText = trimmed.replace(A_MARKER, "").trim();
        if (contentText.length > 0) {
          const offsetInLine = line.text.length - line.text.replace(A_MARKER, "").trimStart().length;
          if (answerStart === -1) answerStart = line.start + offsetInLine;
          answerEnd = line.end;
          answerParts.push(contentText);
        }
      }
      i++;
    }
    const question = cleanQuestion(questionText.replace(TIMESTAMP, "").trim());
    const answer = answerParts.join(" ").trim();
    if (question && answer && answerStart >= 0) {
      items.push({
        question,
        answer,
        citations: [citationFor(file, answerStart, answerEnd, 0.95)],
        timestampLabel: timestamp,
        sortKey: fileIndex * 100000 + qLineIdx,
      });
    }
  }
  return items;
}

/** Mode B: speaker-labeled dialogue ("감사인: ..." / "김민수: ..."). */
function extractDialogueQA(file: UploadedInterviewFile, fileIndex: number): RawQA[] {
  const lines = splitLines(file.contentText);

  type Turn = { speaker: string; text: string; start: number; end: number; lineIdx: number };
  const turns: Turn[] = [];
  let current: Turn | null = null;

  lines.forEach((line, idx) => {
    const m = line.text.match(SPEAKER_LINE);
    if (m) {
      if (current) turns.push(current);
      const contentStart = line.start + m[0].length;
      current = {
        speaker: m[1].trim(),
        text: line.text.slice(m[0].length).trim(),
        start: contentStart,
        end: line.end,
        lineIdx: idx,
      };
    } else if (current && line.text.trim().length > 0) {
      current.text = `${current.text} ${line.text.trim()}`.trim();
      current.end = line.end;
    } else if (current && line.text.trim().length === 0) {
      turns.push(current);
      current = null;
    }
  });
  if (current) turns.push(current);

  if (turns.length < 2) return [];

  // Identify interviewer speakers: known labels first, otherwise the speaker
  // whose turns most often contain a question mark.
  const speakers = [...new Set(turns.map((t) => t.speaker))];
  let interviewers = speakers.filter(isInterviewer);
  if (interviewers.length === 0 && speakers.length >= 2) {
    const ratio = (sp: string) => {
      const own = turns.filter((t) => t.speaker === sp);
      return own.filter((t) => /[?？]/.test(t.text)).length / own.length;
    };
    const sorted = [...speakers].sort((a, b) => ratio(b) - ratio(a));
    if (ratio(sorted[0]) > 0.3) interviewers = [sorted[0]];
  }
  if (interviewers.length === 0) return [];
  const interviewerSet = new Set(interviewers);

  const items: RawQA[] = [];
  for (let t = 0; t < turns.length - 1; t++) {
    const qTurn = turns[t];
    const aTurn = turns[t + 1];
    if (!interviewerSet.has(qTurn.speaker) || interviewerSet.has(aTurn.speaker)) continue;
    const timestamp = qTurn.text.match(TIMESTAMP)?.[1] ?? aTurn.text.match(TIMESTAMP)?.[1];
    const question = cleanQuestion(qTurn.text.replace(TIMESTAMP, "").trim());
    const answer = aTurn.text.replace(TIMESTAMP, "").trim();
    if (!question || !answer) continue;
    items.push({
      question,
      answer,
      citations: [citationFor(file, aTurn.start, aTurn.end, 0.85)],
      timestampLabel: timestamp,
      sortKey: fileIndex * 100000 + qTurn.lineIdx,
    });
  }
  return items;
}

/**
 * Mode C: unstructured manual notes. Bullets and "주제: 내용" lines become
 * low-confidence Q&A stubs. This is mock behavior only; a real LLM call
 * handles free-form notes with the strict prompt in lib/prompts.ts.
 */
function extractNotesQA(file: UploadedInterviewFile, fileIndex: number): RawQA[] {
  const lines = splitLines(file.contentText);
  const items: RawQA[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.text.trim();
    if (trimmed.length < 6) return;
    const bullet = BULLET.test(line.text);
    const stripped = trimmed.replace(BULLET, "").trim();
    const keyed = stripped.match(KEYED_NOTE);
    if (!keyed && !bullet) return;
    if (keyed && isInterviewer(keyed[1])) return;

    let question: string;
    let answer: string;
    if (keyed) {
      question = `"${keyed[1].trim()}" 항목에 기록된 내용은?`;
      answer = keyed[2].trim();
    } else {
      question = "수기 노트에 기록된 사항은?";
      answer = stripped;
    }
    if (!answer) return;
    const offsetInLine = line.text.indexOf(answer.slice(0, 10));
    const start = offsetInLine >= 0 ? line.start + offsetInLine : line.start;
    items.push({
      question,
      answer,
      citations: [citationFor(file, start, line.end, 0.6)],
      sortKey: fileIndex * 100000 + idx,
    });
  });
  return items;
}

function extractFromFile(file: UploadedInterviewFile, fileIndex: number): RawQA[] {
  const qMarkerCount = file.contentText
    .split("\n")
    .filter((l) => Q_MARKER.test(l)).length;
  if (qMarkerCount >= 2) return extractMarkedQA(file, fileIndex);

  const dialogue = extractDialogueQA(file, fileIndex);
  if (dialogue.length > 0) return dialogue;

  return extractNotesQA(file, fileIndex);
}

/** Tokenizes incident context into significant terms for relevance matching. */
function contextTokens(incident: Incident, overviewEntries: OverviewEntry[]): string[] {
  const text = [
    incident.name,
    incident.context ?? "",
    ...overviewEntries.map((e) => `${e.title} ${e.description ?? ""}`),
  ].join(" ");
  const tokens = text.match(/[가-힣]{2,}|[A-Za-z]{3,}/g) ?? [];
  return [...new Set(tokens.map((t) => t.toLowerCase()).filter((t) => !STOPWORDS.has(t)))];
}

function scoreImportance(
  qa: RawQA,
  ctxTokens: string[]
): { importance: Importance; reason: string; contextMatched: boolean } {
  // The answer carries the evidence; the interviewer's question often repeats
  // incident vocabulary, so it is weighted much lower.
  const answer = qa.answer;
  const answerLower = answer.toLowerCase();

  const highInAnswer = HIGH_KEYWORDS.filter((k) => answer.includes(k));
  const highInQuestion = HIGH_KEYWORDS.filter(
    (k) => !highInAnswer.includes(k) && qa.question.includes(k)
  );
  const mediumInAnswer = MEDIUM_KEYWORDS.filter((k) => answer.includes(k));
  const ctxHits = ctxTokens.filter((t) => answerLower.includes(t)).slice(0, 5);

  let score =
    highInAnswer.length * 3 +
    highInQuestion.length * 0.75 +
    mediumInAnswer.length * 1 +
    Math.min(ctxHits.length, 3) * 0.75;
  const hasMoney = MONEY.test(answer);
  if (hasMoney) score += 3.5;
  else if (QUANTITY.test(answer)) score += 1.5;

  const contextMatched = ctxHits.length > 0;

  // High requires a red-flag keyword or a money figure in the answer itself;
  // medium keywords plus context overlap alone cap at Medium.
  if (score >= 5 && (highInAnswer.length > 0 || hasMoney)) {
    const basis = [...new Set([...highInAnswer, ...mediumInAnswer, ...ctxHits])].slice(0, 3).join(", ");
    return {
      importance: "High",
      reason: `핵심 키워드(${basis}) 관련 진술로 사건과 직접 연관됨`,
      contextMatched,
    };
  }
  if (score >= 2) {
    const basis = [...new Set([...highInAnswer, ...mediumInAnswer, ...ctxHits])].slice(0, 3).join(", ");
    return {
      importance: "Medium",
      reason: basis ? `사건 이해에 필요한 맥락 정보(${basis})` : "사건 이해에 필요한 맥락 정보",
      contextMatched,
    };
  }
  return { importance: "Low", reason: "배경 설명 또는 부수적 내용", contextMatched };
}

/** Text similarity via character-bigram Jaccard, used to merge transcript/notes duplicates. */
function bigramSimilarity(a: string, b: string): number {
  const bigrams = (s: string) => {
    const norm = s.replace(/[^가-힣A-Za-z0-9]/g, "");
    const set = new Set<string>();
    for (let i = 0; i < norm.length - 1; i++) set.add(norm.slice(i, i + 2));
    return set;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Two items are duplicates only when both question and answer overlap. */
function isDuplicate(a: RawQA, b: RawQA): boolean {
  return (
    bigramSimilarity(a.question, b.question) > 0.55 &&
    bigramSimilarity(a.answer, b.answer) > 0.35
  );
}

/** Containment: how much of the smaller text's bigrams appear in the larger. */
function bigramContainment(a: string, b: string): number {
  const bigrams = (s: string) => {
    const norm = s.replace(/[^가-힣A-Za-z0-9]/g, "");
    const set = new Set<string>();
    for (let i = 0; i < norm.length - 1; i++) set.add(norm.slice(i, i + 2));
    return set;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / Math.min(A.size, B.size);
}

/** Notes stubs carry only low-confidence citations (see extractNotesQA). */
function isNotesStub(qa: RawQA): boolean {
  return qa.citations.length > 0 && qa.citations.every((c) => c.confidence <= 0.6);
}

export function runMockExtraction(args: {
  incident: Incident;
  overviewEntries: OverviewEntry[];
  uploadedFiles: UploadedInterviewFile[];
  settings: ExtractionSettings;
}): ExtractionResult {
  const { incident, overviewEntries, uploadedFiles, settings } = args;

  // Transcripts first so merged duplicates keep the transcript answer.
  const ordered = [...uploadedFiles].sort((a, b) => {
    const rank = (f: UploadedInterviewFile) =>
      f.sourceType === "transcript" ? 0 : f.sourceType === "unknown" ? 1 : 2;
    return rank(a) - rank(b);
  });

  let raw: RawQA[] = [];
  ordered.forEach((file, idx) => {
    raw = raw.concat(extractFromFile(file, idx));
  });

  // Drop closing pleasantries and empty fragments before merging.
  raw = raw.filter((qa) => {
    const a = qa.answer.trim();
    if (/^(감사합니다|네|예|알겠습니다)[. !]*$/.test(a)) return false;
    const hasSignal =
      /\d/.test(a) ||
      HIGH_KEYWORDS.some((k) => a.includes(k)) ||
      MEDIUM_KEYWORDS.some((k) => a.includes(k));
    return a.length >= 12 || hasSignal;
  });

  // Merge near-duplicate items across files (e.g. transcript + shorthand notes).
  // Shorthand note stubs carry generated questions, so a transcript/notes pair
  // is matched on answer containment instead of question similarity; the
  // transcript item wins and the note becomes an extra citation.
  const merged: RawQA[] = [];
  for (const item of raw) {
    const dup = merged.find(
      (m) =>
        isDuplicate(m, item) ||
        (isNotesStub(item) !== isNotesStub(m) &&
          bigramContainment(m.answer, item.answer) > 0.45)
    );
    if (dup) {
      dup.citations.push(...item.citations);
    } else {
      merged.push(item);
    }
  }
  merged.sort((a, b) => a.sortKey - b.sortKey);

  const ctx = contextTokens(incident, overviewEntries);

  // Importance scoring, dedup and filtering above all ran on the FULL text so
  // keyword detection stays intact; only the displayed Q&A is condensed here.
  // Citations keep quoting the original transcript with exact offsets.
  let qaItems: ExtractedQAItem[] = merged.map((qa) => {
    const { importance, reason, contextMatched } = scoreImportance(qa, ctx);
    return {
      question: condenseQuestion(qa.question),
      answer: condenseAnswer(qa.answer),
      importance,
      importanceReason: reason,
      includedInReport: importance !== "Low",
      sourceCitations: qa.citations,
      timestampLabel: qa.timestampLabel,
      // contextMatched is carried via a temp field for the importantOnly filter below
      _contextMatched: contextMatched,
    } as ExtractedQAItem & { _contextMatched?: boolean };
  });

  const prefilterCount = qaItems.length;

  if (settings.importantOnly) {
    qaItems = qaItems.filter((q) => {
      const matched = (q as ExtractedQAItem & { _contextMatched?: boolean })._contextMatched;
      return q.importance === "High" || (q.importance === "Medium" && matched);
    });
    qaItems = qaItems.map((q) => ({ ...q, includedInReport: true }));
  }

  qaItems = qaItems.map((q) => {
    const { _contextMatched, ...rest } = q as ExtractedQAItem & { _contextMatched?: boolean };
    void _contextMatched;
    return rest;
  });

  return {
    intervieweeName: detectIntervieweeName(uploadedFiles),
    interviewDate: detectInterviewDate(uploadedFiles),
    qaItems,
    prefilterCount,
  };
}
