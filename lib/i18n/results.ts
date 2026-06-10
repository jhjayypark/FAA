import type { Dict } from "@/lib/i18n";

/** Strings for the results module (session results page, Q&A cards, source viewer). */
export const RESULTS = {
  // Not-found and empty states
  "results.notFound.title": { en: "Session not found", ko: "세션을 찾을 수 없음" },
  "results.notFound.description": {
    en: "This interview session does not exist or was removed.",
    ko: "이 인터뷰 세션이 존재하지 않거나 삭제되었습니다.",
  },
  "results.notFound.back": { en: "Back to Incident", ko: "인시던트로 돌아가기" },
  "results.notFound.backAll": {
    en: "Back to Incidents",
    ko: "인시던트 목록으로 돌아가기",
  },
  "results.empty.title": {
    en: "No Q&A items in this session.",
    ko: "이 세션에 Q&A 항목이 없습니다.",
  },
  "results.empty.description": {
    en: "Run a new extraction from the incident page to generate findings.",
    ko: "인시던트 페이지에서 새 추출을 실행하여 Q&A 항목을 생성하십시오.",
  },

  // Session header
  "results.header.back": { en: "Back to incident", ko: "인시던트로 돌아가기" },
  "results.header.eyebrow": { en: "Interview session", ko: "인터뷰 세션" },
  "results.header.unknownInterviewee": {
    en: "Unknown interviewee",
    ko: "면담자 미상",
  },
  "results.header.intervieweeName": { en: "Interviewee name", ko: "면담자 이름" },
  "results.header.editName": {
    en: "Edit interviewee name",
    ko: "면담자 이름 편집",
  },
  "results.header.nameUpdated": {
    en: "Interviewee name updated.",
    ko: "면담자 이름이 수정되었습니다.",
  },
  "results.header.sessionUpdated": {
    en: "Session updated.",
    ko: "세션이 수정되었습니다.",
  },
  "results.header.extracted": {
    en: "Extracted {datetime}",
    ko: "{datetime} 추출",
  },
  "results.header.sourceFiles.one": {
    en: "{count} source file",
    ko: "출처 파일 {count}개",
  },
  "results.header.sourceFiles.many": {
    en: "{count} source files",
    ko: "출처 파일 {count}개",
  },
  "results.header.findings.one": {
    en: "{count} finding",
    ko: "추출 항목 {count}건",
  },
  "results.header.findings.many": {
    en: "{count} findings",
    ko: "추출 항목 {count}건",
  },
  "results.header.interviewDate": { en: "Interview {date}", ko: "{date} 인터뷰" },
  "results.header.noInterviewDate": {
    en: "No interview date",
    ko: "인터뷰 일자 없음",
  },
  "results.header.dateAria": { en: "Interview date", ko: "인터뷰 일자" },
  "results.header.editDate": { en: "Edit interview date", ko: "인터뷰 일자 편집" },

  // Toolbar
  "results.toolbar.sortAria": { en: "Sort order", ko: "정렬 순서" },
  "results.toolbar.sortTime": { en: "Time order", ko: "시간순" },
  "results.toolbar.sortImportanceDesc": {
    en: "Importance: High to Low",
    ko: "중요도 높은 순",
  },
  "results.toolbar.sortImportanceAsc": {
    en: "Importance: Low to High",
    ko: "중요도 낮은 순",
  },
  "results.toolbar.importantOnly": {
    en: "Show important list only",
    ko: "중요 항목만 보기",
  },
  "results.inReportCount": {
    en: "{selected} of {total} in report",
    ko: "보고서 포함 {selected}/{total}건",
  },
  "results.toolbar.exportPdf": { en: "Export PDF", ko: "PDF 내보내기" },
  "results.toolbar.exportPdfTooltip": {
    en: "PDF export is coming in a future version.",
    ko: "PDF 내보내기는 추후 버전에서 제공될 예정입니다.",
  },
  "results.toolbar.generatePptx": { en: "Generate PPTX", ko: "PPTX 생성" },

  // Q&A card
  "results.card.includeInReport": { en: "Include in report", ko: "보고서에 포함" },
  "results.card.edited": { en: "Edited", ko: "수정됨" },
  "results.card.viewSource": { en: "View Source", ko: "출처 보기" },
  "results.card.question": { en: "Question", ko: "질문" },
  "results.card.answer": { en: "Answer", ko: "답변" },
  "results.card.importance": { en: "Importance", ko: "중요도" },
  "results.card.importanceReason": {
    en: "Importance reason",
    ko: "중요도 사유",
  },
  "results.card.emptyError": {
    en: "Question and answer cannot be empty.",
    ko: "질문과 답변은 비워 둘 수 없습니다.",
  },
  "results.card.updated": { en: "Card updated.", ko: "카드가 수정되었습니다." },
  "results.card.reason": { en: "Reason", ko: "사유" },
  "results.card.citations.one": { en: "{count} citation", ko: "인용 {count}건" },
  "results.card.citations.many": { en: "{count} citations", ko: "인용 {count}건" },
  "results.noCitationWarning": {
    en: "No source citation found. Please review before using.",
    ko: "출처 인용을 찾지 못했습니다. 사용 전 검토하시기 바랍니다.",
  },

  // Source viewer
  "results.viewer.title": { en: "Source viewer", ko: "출처 뷰어" },
  "results.viewer.description": {
    en: "Citations for this finding and where they appear in the source document.",
    ko: "이 항목의 인용과 출처 문서 내 인용 위치를 표시합니다.",
  },
  "results.viewer.showMore": { en: "Show more", ko: "더 보기" },
  "results.viewer.showLess": { en: "Show less", ko: "접기" },
  "results.viewer.citations": { en: "Citations", ko: "인용" },
  "results.viewer.citationOf": {
    en: "Citation {current} of {total}",
    ko: "인용 {current}/{total}",
  },
  "results.viewer.prevCitation": { en: "Previous citation", ko: "이전 인용" },
  "results.viewer.nextCitation": { en: "Next citation", ko: "다음 인용" },
  "results.viewer.sourceType.transcript": { en: "Transcript", ko: "녹취록" },
  "results.viewer.sourceType.manualNotes": { en: "Manual notes", ko: "수기 메모" },
  "results.viewer.sourceType.unknown": { en: "Unknown", ko: "알 수 없음" },
  "results.viewer.noDocTitle": {
    en: "No document to preview",
    ko: "미리 볼 문서 없음",
  },
  "results.viewer.noDocDescription": {
    en: "This finding has no source citations to display.",
    ko: "이 항목에는 표시할 출처 인용이 없습니다.",
  },
  "results.viewer.fileMissingTitle": {
    en: "Source file not found",
    ko: "출처 파일을 찾을 수 없음",
  },
  "results.viewer.fileMissingDescription": {
    en: "The cited file is no longer part of this session.",
    ko: "인용된 파일이 더 이상 이 세션에 포함되어 있지 않습니다.",
  },
  "results.viewer.quoteNotFound": {
    en: "Could not locate exact quote in source document.",
    ko: "출처 문서에서 정확한 인용 구절을 찾지 못했습니다.",
  },
} satisfies Dict;
