import type { Dict } from "@/lib/i18n";

/** App shell, navigation, profile, settings, and shared labels. */
export const COMMON = {
  "common.appName": { en: "FNS Audit Assistant", ko: "FNS Audit Assistant" },
  "common.orgLine": { en: "Internal Audit, FNS Inc.", ko: "FNS 내부감사실" },
  "common.nav.assistant": { en: "Assistant", ko: "어시스턴트" },
  "common.nav.incidents": { en: "Incidents", ko: "인시던트" },
  "common.nav.open": { en: "Open navigation", ko: "내비게이션 열기" },
  "common.footer.confidential": {
    en: "Audit materials stay in this browser and are not uploaded to any server. Confidential: for FNS internal audit use only.",
    ko: "감사 자료는 이 브라우저에만 저장되며 서버로 전송되지 않습니다. 대외비: FNS 내부감사 용도로만 사용하십시오.",
  },
  "common.profile.role": { en: "Internal Auditor", ko: "내부감사인" },
  "common.profile.open": { en: "Open settings", ko: "설정 열기" },
  "common.settings.title": { en: "Settings", ko: "설정" },
  "common.settings.description": {
    en: "Profile and interface preferences. Stored in this browser.",
    ko: "프로필 및 인터페이스 설정입니다. 이 브라우저에 저장됩니다.",
  },
  "common.settings.displayName": { en: "Display name", ko: "표시 이름" },
  "common.settings.language": { en: "Interface language", ko: "인터페이스 언어" },
  "common.settings.languageHelp": {
    en: "Applies to interface labels only. Extracted findings and assistant replies are always Korean.",
    ko: "인터페이스 라벨에만 적용됩니다. 추출 결과와 어시스턴트 답변은 항상 한국어입니다.",
  },
  "common.settings.language.en": { en: "English", ko: "English" },
  "common.settings.language.ko": { en: "한국어", ko: "한국어" },
  "common.settings.done": { en: "Done", ko: "완료" },
  "common.map.openExternal": { en: "Open in Google Maps", ko: "Google 지도에서 열기" },
  "common.map.showOnMap": { en: "Show {name} on the map", ko: "{name} 지도 보기" },
  "common.cancel": { en: "Cancel", ko: "취소" },
  "common.save": { en: "Save", ko: "저장" },
  "common.edit": { en: "Edit", ko: "편집" },
  "common.delete": { en: "Delete", ko: "삭제" },
  "common.back": { en: "Back", ko: "뒤로" },
  "common.close": { en: "Close", ko: "닫기" },
  "common.open": { en: "Open", ko: "열기" },
  "common.continue": { en: "Continue", ko: "계속" },
} satisfies Dict;
