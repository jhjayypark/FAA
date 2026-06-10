import type { Dict } from "@/lib/i18n";

/** Strings for the assistant module (incident-scoped chat). */
export const ASSISTANT = {
  "assistant.title": { en: "Assistant", ko: "어시스턴트" },
  "assistant.selectIncident": { en: "Select incident", ko: "인시던트 선택" },
  "assistant.clear": { en: "Clear conversation", ko: "대화 지우기" },
  "assistant.clearDescription": {
    en: 'This removes all messages for "{name}". This action cannot be undone.',
    ko: '"{name}" 인시던트의 모든 메시지가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
  },
  "assistant.clearAction": { en: "Clear", ko: "지우기" },
  "assistant.clearedToast": {
    en: "Conversation cleared.",
    ko: "대화 내용을 지웠습니다.",
  },
  "assistant.replyError": {
    en: "Could not generate a reply. Please try again.",
    ko: "답변을 생성하지 못했습니다. 다시 시도해 주십시오.",
  },
  "assistant.emptyNoIncidentsTitle": {
    en: "No incidents yet",
    ko: "등록된 인시던트가 없습니다",
  },
  "assistant.emptyNoIncidentsDescription": {
    en: "Create an incident first, then ask questions grounded in its audit materials.",
    ko: "먼저 인시던트를 생성한 뒤, 해당 감사 자료에 근거해 질문할 수 있습니다.",
  },
  "assistant.goToIncidents": { en: "Go to Incidents", ko: "인시던트로 이동" },
  "assistant.emptyNoSelectionTitle": {
    en: "No incident selected",
    ko: "선택된 인시던트가 없습니다",
  },
  "assistant.emptyNoSelectionDescription": {
    en: "Select an incident to ask questions based on its audit context.",
    ko: "인시던트를 선택하면 해당 감사 맥락에 기반해 질문할 수 있습니다.",
  },
  "assistant.grounding": {
    en: "Answers are grounded in this incident's interviews, notes, and findings. The assistant replies in Korean.",
    ko: "답변은 이 사건의 인터뷰, 노트, 추출 항목에 근거합니다.",
  },
  "assistant.thinking": {
    en: "Analyzing incident materials...",
    ko: "사건 자료를 분석하는 중...",
  },
  "assistant.composerPlaceholder": {
    en: "Ask about this incident...",
    ko: "이 사건에 대해 질문을 입력하십시오...",
  },
  "assistant.composerLabel": {
    en: "Ask about this incident",
    ko: "이 사건에 대한 질문 입력",
  },
  "assistant.sendLabel": { en: "Send message", ko: "메시지 전송" },
} satisfies Dict;
