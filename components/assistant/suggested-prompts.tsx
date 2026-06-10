"use client";

/** Korean starter prompts; each maps to a mock engine intent. */
export const SUGGESTED_PROMPTS = [
  "이 사건에서 가장 중요한 쟁점은 뭐야?",
  "인터뷰 답변 중 서로 모순되는 부분이 있어?",
  "PPT에 넣을 핵심 finding만 정리해줘.",
  "추가 인터뷰에서 물어봐야 할 질문을 추천해줘.",
] as const;

/** Workspace-wide prompts shown in general mode (no incident selected). */
export const GENERAL_PROMPTS = [
  "등록된 인시던트 현황 알려줘",
  "전체 인터뷰에서 서로 모순되는 답변이 있어?",
  "추가 확인이 필요한 항목들을 정리해줘",
] as const;

export function SuggestedPrompts({
  onSelect,
  disabled,
  mode = "incident",
}: {
  onSelect: (question: string) => void;
  disabled?: boolean;
  mode?: "incident" | "general";
}) {
  const prompts = mode === "general" ? GENERAL_PROMPTS : SUGGESTED_PROMPTS;
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
