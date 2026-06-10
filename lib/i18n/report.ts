import type { Dict } from "@/lib/i18n";

/** Strings for the report module (report-dialog chrome only; slide content stays English). */
export const REPORT = {
  "report.optionsTitle": { en: "Generate PPTX Report", ko: "PPTX 보고서 생성" },
  "report.optionsDescription": {
    en: "Configure the report content, then preview the slides before downloading.",
    ko: "보고서 내용을 설정한 뒤 슬라이드를 미리 확인하고 다운로드합니다.",
  },
  "report.titleLabel": { en: "Report title", ko: "보고서 제목" },
  "report.titleRequired": {
    en: "Report title is required.",
    ko: "보고서 제목은 필수 항목입니다.",
  },
  "report.themeColorLabel": { en: "Theme color", ko: "테마 색상" },
  "report.themeColorSwatch": { en: "Theme color swatch", ko: "테마 색상 선택" },
  "report.hexInvalid": {
    en: "Enter a valid 6 digit hex color, for example #1F3A5F.",
    ko: "올바른 6자리 HEX 색상 값을 입력하십시오. 예: #1F3A5F",
  },
  "report.templateLabel": { en: "PPTX template (optional)", ko: "PPTX 템플릿 (선택)" },
  "report.templateNote": {
    en: "Template uploaded. Template styling will be supported in the next version.",
    ko: "템플릿이 업로드되었습니다. 템플릿 스타일 적용은 다음 버전에서 지원될 예정입니다.",
  },
  "report.includeLabel": { en: "Include in report", ko: "보고서 포함 항목" },
  "report.include.context": { en: "Incident context", ko: "인시던트 배경" },
  "report.include.locations": { en: "Involved locations", ko: "관련 사업장" },
  "report.include.badges": { en: "Importance badges", ko: "중요도 배지" },
  "report.include.citations": { en: "Source citations", ko: "출처 인용" },
  "report.include.appendix": {
    en: "Appendix with all selected Q&A",
    ko: "선택한 Q&A 전체 부록",
  },
  "report.selectedSummary.one": {
    en: "{count} selected Q&A item will be included.",
    ko: "선택한 Q&A {count}건이 보고서에 포함됩니다.",
  },
  "report.selectedSummary.many": {
    en: "{count} selected Q&A items will be included.",
    ko: "선택한 Q&A {count}건이 보고서에 포함됩니다.",
  },
  "report.incidentSummary": {
    en: "{sessions} interviewees · {count} selected Q&A items will be included.",
    ko: "인터뷰 대상자 {sessions}명 · 선택한 Q&A {count}건이 보고서에 포함됩니다.",
  },
  "report.noneSelected": {
    en: "No Q&A cards are selected for the report. Select cards on the results page first.",
    ko: "보고서에 포함할 Q&A 카드가 선택되지 않았습니다. 먼저 결과 페이지에서 카드를 선택하십시오.",
  },
  "report.generatePreview": { en: "Generate Preview", ko: "미리보기 생성" },
  "report.previewTitle": { en: "Report Preview", ko: "보고서 미리보기" },
  "report.previewDescription.one": {
    en: "{count} slide. Review the layout, then download the PPTX file.",
    ko: "슬라이드 {count}장입니다. 레이아웃을 확인한 뒤 PPTX 파일을 다운로드하십시오.",
  },
  "report.previewDescription.many": {
    en: "{count} slides. Review the layout, then download the PPTX file.",
    ko: "슬라이드 {count}장입니다. 레이아웃을 확인한 뒤 PPTX 파일을 다운로드하십시오.",
  },
  "report.backToOptions": { en: "Back to options", ko: "옵션으로 돌아가기" },
  "report.downloadPptx": { en: "Download PPTX", ko: "PPTX 다운로드" },
  "report.downloading": { en: "Downloading...", ko: "다운로드 중..." },
  "report.toastDownloaded": { en: "PPTX downloaded.", ko: "PPTX 파일이 다운로드되었습니다." },
  "report.toastFailed": {
    en: "Failed to generate the PPTX file.",
    ko: "PPTX 파일 생성에 실패했습니다.",
  },
} satisfies Dict;
