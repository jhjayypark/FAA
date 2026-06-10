/**
 * Shared text heuristics for the mock extraction engine.
 *
 * - isQuestionLike: does a span of Korean text actually read as a question?
 *   Used to recover mislabeled STT speaker turns, to detect numbered question
 *   lines in written notes, and to guard that every emitted Q&A question is
 *   question-shaped.
 * - topicOverlap: content-token overlap between two texts, used to merge a
 *   transcript item with the handwritten-note item covering the same exchange.
 *
 * Kept separate from mock-extractor.ts so the extractor and condensing pass
 * can share these helpers without deepening the existing import cycle.
 */

/**
 * Interrogative signals in spoken/written Korean interview questions.
 * Deliberately generous (polite endings, request forms, question adverbs) but
 * tuned so that declarative answer continuations that STT mislabels as the
 * interviewer ("...팀장을 통해서 얘기하실 수도 있고.") do NOT match.
 */
const INTERROGATIVE_MARKERS =
  /습니까|입니까|할까요|을까요|나요|가요|시죠|는지요?|은지|었는지|있는지|인가요|주세요|주시겠|부탁드|부탁합|말씀해|설명해|설명 부탁|말씀 부탁|어떻게|어떤가|왜 |언제 |어디서|누가 |누구|몇 |얼마나?|무엇|뭐예요|뭔가요/;

/** True when the text contains a question mark or an interrogative marker. */
export function isQuestionLike(text: string): boolean {
  return /[?？]/.test(text) || INTERROGATIVE_MARKERS.test(text);
}

/** Common words excluded when tokenizing incident context for relevance matching. */
export const STOPWORDS = new Set([
  "있다", "없다", "한다", "있는", "대한", "관련", "그리고", "하지만", "그래서",
  "the", "and", "for", "with", "this", "that", "from",
]);

/**
 * Spoken-language fillers and content-free verb forms additionally excluded
 * from cross-source topic matching: they appear in nearly every answer, so
 * sharing them says nothing about whether two items cover the same exchange.
 */
const TOPIC_STOPWORDS = new Set([
  ...STOPWORDS,
  "얘기", "이야기", "말씀", "그거", "그게", "그건", "이거", "저거",
  "여기", "거기", "저기", "그때", "하시", "해야", "해서", "하면", "되면",
  "있고", "없고", "있어요", "없어요", "있었어요", "없었어요",
  "있습니다", "없습니다", "같아요", "같습니다", "아니면", "그러면",
  "그렇게", "이렇게", "그런", "이런", "일단", "사실", "그냥", "이제",
  "약간", "진짜", "정말", "너무", "조금", "경우", "부분", "정도",
  "제가", "저희", "저는", "우리", "다른",
]);

const TOKEN_PATTERN = /[가-힣]{2,}|[A-Za-z]{3,}|\d+/g;

/**
 * Trailing case particles (조사) stripped during token normalization so that
 * inflected mentions of the same noun match ("팀장님이"/"팀장님께" → "팀장님").
 * Longest first; a strip only applies when at least 2 characters remain.
 */
const JOSA_SUFFIXES = [
  "에게서", "에서는", "에게는", "한테서", "으로는", "으로서", "으로써",
  "에게", "한테", "께서", "에서", "에는", "으로", "이랑", "라고",
  "까지", "부터", "처럼", "보다", "마다", "조차", "마저",
  "이", "가", "은", "는", "을", "를", "에", "께", "와", "과", "도", "만",
  "의", "로", "랑", "엔",
];

/**
 * Common verbal endings stripped once after the particle pass, so that a
 * verbalized topic noun matches its bare mention ("진행되는"/"진행이" → "진행",
 * "소통하시는지" → "소통"). Longest first; same 2-character remainder rule.
 */
const ENDING_SUFFIXES = [
  "하시겠습니까", "하시겠어요", "하셨습니까",
  "하십니까", "했습니까", "었습니다", "겠습니다", "했습니다", "하시는지", "하시나요",
  "습니까", "입니까", "습니다", "합니다", "입니다", "됩니다",
  "하는지", "되는지", "인가요", "되나요", "하나요", "하세요", "하고요", "하시고", "하시는", "하기도",
  "는지", "나요", "가요", "세요", "고요", "어요", "아요", "예요", "해요", "네요", "데요",
  "하실", "하는", "되는", "하고", "되고", "했고", "한다", "된다", "했다",
  "적인", "적",
];

const MIN_TOKEN_REMAINDER = 2;

function stripSuffix(token: string, suffixes: readonly string[]): string {
  for (const suffix of suffixes) {
    if (token.length - suffix.length >= MIN_TOKEN_REMAINDER && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

/** Strips up to two trailing particles, then one verbal ending. */
function normalizeHangulToken(token: string): string {
  let t = stripSuffix(token, JOSA_SUFFIXES);
  t = stripSuffix(t, JOSA_SUFFIXES);
  return stripSuffix(t, ENDING_SUFFIXES);
}

/**
 * Significant content tokens of a text: hangul runs (>= 2 chars, normalized),
 * latin words (>= 3 chars, lowercased) and numbers, minus the stoplist.
 */
function contentTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of text.match(TOKEN_PATTERN) ?? []) {
    const token = /[가-힣]/.test(raw)
      ? normalizeHangulToken(raw)
      : raw.toLowerCase();
    if (token.length < MIN_TOKEN_REMAINDER && !/^\d+$/.test(token)) continue;
    if (TOPIC_STOPWORDS.has(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

/** Two items must share at least this many distinct content tokens to merge. */
const MIN_SHARED_TOKENS = 4;
/** ... and this overlap coefficient (|intersection| / min set size). */
const MIN_OVERLAP_COEFFICIENT = 0.25;

export type TopicOverlap = {
  sharedCount: number;
  coefficient: number;
  /** True when the pair passes all topic-match thresholds. */
  matches: boolean;
};

/**
 * Measures whether two texts cover the same topic. `matches` additionally
 * requires at least one "specific" shared token (latin word, number, or a
 * hangul token of >= 3 chars) so that generic two-syllable words alone never
 * merge unrelated items. Exact person-name matches are NOT required: STT
 * spelling variance ("최종호"/"최종오") makes name tokens unreliable.
 */
/**
 * Loose topic-continuity check: do the two texts share at least one SPECIFIC
 * content token (latin word, number, or hangul token of >= 3 chars)? Used to
 * decide whether a short interviewer probe continues the ongoing answer
 * ("(진단팀: 해당 화물의 Dispatch는 누가 합니까?)") or opens a new topic.
 * Far weaker than topicOverlap on purpose — a probe is short, so threshold
 * counts would never be met.
 */
export function sharesSpecificTopicToken(aText: string, bText: string): boolean {
  const a = contentTokens(aText);
  const b = contentTokens(bText);
  for (const token of a) {
    if (!b.has(token)) continue;
    if (/^[a-z]/.test(token) || /^\d+$/.test(token) || /^[가-힣]{3,}$/.test(token)) {
      return true;
    }
  }
  return false;
}

export function topicOverlap(aText: string, bText: string): TopicOverlap {
  const a = contentTokens(aText);
  const b = contentTokens(bText);
  if (a.size === 0 || b.size === 0) {
    return { sharedCount: 0, coefficient: 0, matches: false };
  }
  let sharedCount = 0;
  let hasSpecificToken = false;
  for (const token of a) {
    if (!b.has(token)) continue;
    sharedCount++;
    if (/^[a-z]/.test(token) || /^\d+$/.test(token) || /^[가-힣]{3,}$/.test(token)) {
      hasSpecificToken = true;
    }
  }
  const coefficient = sharedCount / Math.min(a.size, b.size);
  return {
    sharedCount,
    coefficient,
    matches:
      sharedCount >= MIN_SHARED_TOKENS &&
      coefficient >= MIN_OVERLAP_COEFFICIENT &&
      hasSpecificToken,
  };
}
