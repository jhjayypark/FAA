/**
 * Heuristic condensing pass for extracted Q&A display text.
 *
 * The mock extractor copies transcript text near-verbatim, which produces
 * rambling questions (interviewers restate the same question 2-3 ways) and
 * long answers full of spoken-language filler. This module shortens both
 * WITHOUT an LLM by SELECTING the most informative sentences/clauses that
 * already exist in the source — it never rewrites or invents, so every fact
 * in the output is present verbatim in the input. Uncertainty hedges
 * ("잘 모르겠습니다", "~인 것 같습니다") and negations are deliberately kept:
 * for audit evidence, hedging IS meaning.
 *
 * Source citations are untouched — they are built from exact offsets before
 * this pass runs and continue to quote the original transcript.
 */

import { HIGH_KEYWORDS, MEDIUM_KEYWORDS } from "@/lib/extraction/mock-extractor";

/** Spoken-question openers ("네, 그러면 ..."); longest first so "그" matches last. */
const LEADING_FILLER = /^(?:그러니까|그러면|그래서|그니까|그럼|이제|네|아|어|음|그|자)[,，]?\s+/;

/** Never strip a question down past this many characters. */
const MIN_QUESTION_REMAINDER = 6;

/**
 * Content-free confirmation tags interviewers append after the real question
 * ("그렇죠?", "맞습니까?"). Selecting one of these AS the question would
 * destroy the question's content, so they are never eligible.
 */
const TAG_QUESTION =
  /^(?:안\s*)?(?:그렇죠|그렇지요|그렇습니까|그쵸|그죠|맞죠|맞지요|맞습니까|맞나요|맞으시죠|맞으시지요|네|예|아닌가요|그런가요)\s*[?？]+$/;

/**
 * Keep only the clearest formulation of a multi-part question. Interviewers
 * SPEAKING nearly always restate the question most clearly LAST, so when
 * several interrogative sentences were joined by cleanQuestion, the last
 * SUBSTANTIVE one wins — trailing tag questions ("그렇죠?") and too-short
 * fragments are skipped, and if nothing substantive remains the input is left
 * alone. WRITTEN notes are the opposite: the main question is stated first and
 * later sentences are follow-ups, so notes-derived questions pass
 * `preferFirst` to select the first substantive interrogative instead.
 * Selection + filler stripping only — no 해요체→합쇼체 conversion, which is
 * too risky to do morphologically.
 */
export function condenseQuestion(
  question: string,
  options?: { preferFirst?: boolean }
): string {
  let q = question.replace(/\s+/g, " ").trim();

  const sentences = q.split(/(?<=[.?!？])\s+/).filter(Boolean);
  const interrogatives = sentences.filter((s) => /[?？]$/.test(s));
  if (interrogatives.length >= 2) {
    const substantive = interrogatives.filter(
      (s) =>
        !TAG_QUESTION.test(s) &&
        s.replace(/[\s?？.!,…~]/g, "").length >= MIN_QUESTION_REMAINDER
    );
    if (substantive.length > 0) {
      q = options?.preferFirst
        ? substantive[0]
        : substantive[substantive.length - 1];
    }
  }

  let m: RegExpMatchArray | null;
  while ((m = q.match(LEADING_FILLER))) {
    const rest = q.slice(m[0].length);
    if (rest.length < MIN_QUESTION_REMAINDER) break;
    q = rest;
  }
  return q;
}

/** Answers at or below this length are already terse (e.g. mode-C notes). */
const ANSWER_KEEP_THRESHOLD = 90;
/** Combined character budget for the condensed answer. */
const ANSWER_BUDGET = 160;
const MAX_CLAUSES = 3;
/** Fragments shorter than this merge forward — they came from over-eager splits. */
const MIN_CLAUSE_LENGTH = 8;

/**
 * Clause boundaries for transcripts that lack sentence punctuation: either
 * real punctuation, or a word ending in a Korean sentence-final syllable
 * (요/다/죠/까/함/됨/음) optionally followed by punctuation, then whitespace.
 * The final syllable must be preceded by another hangul character so that
 * standalone particles ("다", "음") never trigger a split. Common nouns that
 * merely END in one of those syllables mid-sentence ("검토한 다음 주간 회의",
 * "운송비 포함 총액", "승인이 필요 없었다") are excluded via negative
 * lookbehind — splitting after them severs a sentence in half, and selecting
 * the halves independently can fabricate a relationship not in the source.
 */
const CLAUSE_BOUNDARY =
  /(?<=[.?!？])\s+|(?<=[가-힣][요다죠까함됨음][.?!,]?)(?<!(?:다음|처음|마음|도움|걸음|모음|믿음|웃음|얼음|싸움|죽음|아까|포함|필요|소요|중요|주요|개요|수요)[.?!,]?)\s+/;

const LATIN_TOKEN = /[A-Za-z]{2,}/;
/** "최종호 팀장", "김과장" — a short hangul token directly before a job title. */
const NAME_TITLE = /[가-힣]{2,4}\s?(?:팀장|차장|과장|대리|실장|상무|사원)/;

/** Standalone acknowledgements that carry no facts. */
const PURE_FILLER = /^(?:네|예|아|음|어|그렇죠|그렇습니다|맞아요|맞습니다)[\s.,!?…~]*$/;

/**
 * Uncertainty hedges, denials, and refusals ("잘 모르겠습니다", "받은 적은
 * 없습니다"). For audit evidence these are meaning-bearing (see module doc),
 * so they score like facts and survive clause selection.
 */
const HEDGE_OR_DENIAL =
  /모르겠|모릅니다|기억나지|기억이\s*나지|기억(?:은|이|도)?\s*안\s*나|않았습니다|않습니다|않았어요|않아요|없습니다|없었습니다|없어요|없었어요|아닙니다|아니에요|못했습니다|못\s*했습니다|거부/;

/**
 * Tokens used to detect content-free generic clauses ("그거는 그때그때 다른 것
 * 같아요"). A clause made only of these scores 0 and is dropped — unless it is
 * all that exists, in which case it is kept verbatim.
 */
const GENERIC_TOKENS = new Set([
  "그거", "그게", "그건", "그거는", "그것은", "그것도", "그때그때", "그때",
  "다른", "다릅니다", "달라요", "것", "거", "같아요", "같습니다",
  "네", "예", "아", "음", "어", "이제", "뭐", "좀", "약간", "막",
  "그렇죠", "그렇습니다", "맞아요", "맞습니다", "그러니까", "그니까",
  "그래서", "그러면", "그럼", "일단", "사실", "그냥", "이렇게", "그렇게",
]);

/**
 * Discourse fillers safe to drop inside a kept clause. Word-boundary safe:
 * only standalone tokens between spaces, never inside a word ("처음", "마음").
 * Hedge expressions (잘 모르~, ~것 같~) are intentionally NOT in this list,
 * and neither are degree qualifiers (좀/약간/막): "재고가 좀 부족했다" →
 * "재고가 부족했다" strengthens recorded testimony, which is a meaning change.
 */
const INLINE_FILLER = /(^|\s)(?:이제|그니까|그러니까|어|음|뭐)(?=\s|$)/g;

function splitClauses(answer: string): string[] {
  const parts = answer.split(CLAUSE_BOUNDARY).map((p) => p.trim()).filter(Boolean);
  const clauses: string[] = [];
  let pending = "";
  for (const part of parts) {
    pending = pending ? `${pending} ${part}` : part;
    if (pending.length >= MIN_CLAUSE_LENGTH) {
      clauses.push(pending);
      pending = "";
    }
  }
  // A short trailing fragment ("복합적이네요?") stays separate so the scorer
  // can drop it, instead of contaminating the previous substantive clause.
  if (pending) clauses.push(pending);
  return clauses;
}

function hasSubstance(clause: string): boolean {
  const tokens = clause.match(/[가-힣]+|[A-Za-z]+|\d+/g) ?? [];
  return tokens.some((t) => !GENERIC_TOKENS.has(t));
}

function scoreClause(clause: string): number {
  if (PURE_FILLER.test(clause)) return 0;
  let score = 0;
  if (/\d/.test(clause)) score += 3;
  for (const k of HIGH_KEYWORDS) if (clause.includes(k)) score += 2;
  for (const k of MEDIUM_KEYWORDS) if (clause.includes(k)) score += 2;
  if (LATIN_TOKEN.test(clause) || NAME_TITLE.test(clause)) score += 1;
  if (HEDGE_OR_DENIAL.test(clause)) score += 2;
  // Length bonus only for clauses with real content; pure ramble stays at 0.
  if (score === 0 && !hasSubstance(clause)) return 0;
  if (clause.length >= 20 && clause.length <= 80) score += 0.5;
  return score;
}

function stripInlineFillers(clause: string): string {
  const stripped = clause
    .replace(INLINE_FILLER, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return stripped.length > 0 ? stripped : clause;
}

/**
 * Keep only the substantive clauses of a long spoken answer: facts (numbers,
 * names, keyword-bearing statements) survive; empty openers and trailing
 * commentary are dropped. Clauses are emitted in their original order.
 */
export function condenseAnswer(answer: string): string {
  const text = answer.replace(/\s+/g, " ").trim();
  if (text.length <= ANSWER_KEEP_THRESHOLD) return text;

  const clauses = splitClauses(text);
  if (clauses.length <= 1) return text; // nothing to safely cut

  const scored = clauses.map((clause, index) => ({
    clause,
    index,
    score: scoreClause(clause),
  }));

  // Greedy pick by score; the first pick is always allowed even over budget
  // so at least one clause survives.
  const candidates = [...scored]
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked: typeof scored = [];
  let used = 0;
  for (const c of candidates) {
    if (picked.length >= MAX_CLAUSES) break;
    const cost = c.clause.length + (picked.length > 0 ? 1 : 0);
    if (picked.length > 0 && used + cost > ANSWER_BUDGET) continue;
    picked.push(c);
    used += cost;
  }
  if (picked.length === 0) picked.push(scored[0]); // all filler: keep the opener

  picked.sort((a, b) => a.index - b.index);
  return picked.map((c) => stripInlineFillers(c.clause)).join(" ");
}
