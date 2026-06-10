import type { Dict } from "@/lib/i18n";

/** Strings for the extraction module (upload -> rules -> extract flow). */
export const EXTRACTION = {
  // Page header
  "extraction.title": {
    en: "Extract Interview Insights",
    ko: "인터뷰 인사이트 추출",
  },
  "extraction.subtitle": {
    en: "Upload interview material, confirm extraction rules, and generate cited Q&A findings.",
    ko: "인터뷰 자료를 업로드하고 추출 규칙을 확인한 뒤 출처가 인용된 Q&A 항목을 생성합니다.",
  },

  // Not-found state
  "extraction.notFound.title": {
    en: "Incident not found",
    ko: "인시던트를 찾을 수 없습니다",
  },
  "extraction.notFound.description": {
    en: "This incident may have been deleted or the link is incorrect.",
    ko: "인시던트가 삭제되었거나 링크가 올바르지 않을 수 있습니다.",
  },
  "extraction.notFound.back": {
    en: "Back to incidents",
    ko: "인시던트 목록으로",
  },

  // Toasts
  "extraction.toast.complete": {
    en: "Extraction complete.",
    ko: "추출이 완료되었습니다.",
  },
  "extraction.toast.readError": {
    en: "Could not read {fileName}.",
    ko: "{fileName} 파일을 읽을 수 없습니다.",
  },

  // Stepper
  "extraction.stepper.aria": { en: "Extraction steps", ko: "추출 단계" },
  "extraction.step.upload": { en: "Upload Files", ko: "파일 업로드" },
  "extraction.step.rules": { en: "Extraction Rules", ko: "추출 규칙" },
  "extraction.step.extract": { en: "Extract", ko: "추출" },

  // Upload step
  "extraction.upload.dropzoneAria": {
    en: "Upload interview files",
    ko: "인터뷰 파일 업로드",
  },
  "extraction.upload.dropTitle": {
    en: "Drop files here or browse",
    ko: "파일을 여기에 끌어다 놓거나 클릭하여 선택",
  },
  "extraction.upload.formats": {
    en: "Supports .txt, .md, .docx, .pdf. Korean transcripts and manual notes.",
    ko: ".txt, .md, .docx, .pdf 형식을 지원합니다. 한국어 녹취록 및 수기 노트용입니다.",
  },
  "extraction.upload.audioNote": {
    en: "Audio and video transcription is coming soon.",
    ko: "오디오 및 비디오 전사 기능은 준비 중입니다.",
  },
  "extraction.upload.linkLabel": { en: "Attach from link", ko: "링크로 첨부" },
  "extraction.upload.linkPlaceholder": {
    en: "Paste a public link, e.g. a Plaud share link",
    ko: "공개 링크를 붙여넣으십시오 (예: Plaud 공유 링크)",
  },
  "extraction.upload.linkAdd": { en: "Add link", ko: "링크 추가" },
  "extraction.upload.linkHelp": {
    en: "Plaud share links import the full transcript with speakers and timestamps. Other public pages import as plain text.",
    ko: "Plaud 공유 링크는 화자와 타임스탬프가 포함된 전체 녹취록을 가져옵니다. 그 외 공개 페이지는 일반 텍스트로 가져옵니다.",
  },
  "extraction.upload.linkInvalid": {
    en: "Enter a valid http(s) link.",
    ko: "올바른 http(s) 링크를 입력하십시오.",
  },
  "extraction.upload.linkAdded": { en: "Link imported.", ko: "링크를 가져왔습니다." },
  "extraction.upload.sourceType.transcript": {
    en: "Transcript",
    ko: "녹취록",
  },
  "extraction.upload.sourceType.manualNotes": {
    en: "Manual Notes",
    ko: "수기 노트",
  },
  "extraction.upload.sourceType.unknown": {
    en: "Unknown",
    ko: "알 수 없음",
  },
  "extraction.upload.sourceTypeAria": {
    en: "Source type for {fileName}",
    ko: "{fileName} 출처 유형",
  },
  "extraction.upload.removeAria": {
    en: "Remove {fileName}",
    ko: "{fileName} 제거",
  },

  // Rules step
  "extraction.rules.title": { en: "Extraction Rules", ko: "추출 규칙" },
  "extraction.rules.subtitle": {
    en: "How Q&A should be extracted from the source material.",
    ko: "원본 자료에서 Q&A를 추출하는 방식입니다.",
  },
  "extraction.rules.stylePreset": { en: "Style preset", ko: "스타일 프리셋" },
  "extraction.rules.strictFactual": {
    en: "Strict factual extraction",
    ko: "엄격한 사실 기반 추출",
  },
  "extraction.rules.required": { en: "Required", ko: "필수" },
  "extraction.rules.mandatoryHeading": {
    en: "Mandatory rules (non-negotiable)",
    ko: "필수 규칙 (변경 불가)",
  },
  "extraction.rules.importantOnly": {
    en: "Extract most important insights only",
    ko: "가장 중요한 인사이트만 추출",
  },
  "extraction.rules.importantOnlyHelp": {
    en: "Only Q&A pairs most relevant to this incident are extracted. Every item still carries source citations. When off, all Q&A pairs are extracted and marked with importance.",
    ko: "이 인시던트와 가장 관련성이 높은 Q&A 항목만 추출합니다. 모든 항목에는 출처 인용이 포함됩니다. 해제하면 모든 Q&A 항목을 추출하고 중요도를 표시합니다.",
  },
  "extraction.rules.extract": { en: "Extract Insights", ko: "인사이트 추출" },

  // Pipeline stage labels (mapped from lib/extraction/extract.ts values)
  "extraction.stage.parsing": {
    en: "Parsing source files",
    ko: "원본 파일 분석",
  },
  "extraction.stage.structure": {
    en: "Identifying interview structure",
    ko: "인터뷰 구조 파악",
  },
  "extraction.stage.extracting": {
    en: "Extracting Q&A pairs",
    ko: "Q&A 항목 추출",
  },
  "extraction.stage.scoring": {
    en: "Scoring importance",
    ko: "중요도 평가",
  },
  "extraction.stage.citations": {
    en: "Attaching source citations",
    ko: "출처 인용 연결",
  },

  // Progress card
  "extraction.progress.title": {
    en: "Extracting insights",
    ko: "인사이트 추출 중",
  },
  "extraction.progress.description": {
    en: "Q&A pairs are being extracted from the uploaded files. Keep this page open.",
    ko: "업로드한 파일에서 Q&A 항목을 추출하고 있습니다. 이 페이지를 닫지 마십시오.",
  },

  // Empty state: everything filtered out
  "extraction.progress.filteredTitle": {
    en: "All Q&A pairs were filtered out",
    ko: "모든 Q&A 항목이 필터링되었습니다",
  },
  "extraction.progress.filtered.one": {
    en: '1 Q&A pair was extracted, but it did not meet the bar for "Extract most important insights only". Uncheck the option in the rules step to keep all pairs.',
    ko: 'Q&A 항목 1건이 추출되었으나 "가장 중요한 인사이트만 추출" 기준을 충족하지 못했습니다. 규칙 단계에서 해당 옵션을 해제하면 모든 항목이 유지됩니다.',
  },
  "extraction.progress.filtered.many": {
    en: '{count} Q&A pairs were extracted, but none met the bar for "Extract most important insights only". Uncheck the option in the rules step to keep all pairs.',
    ko: 'Q&A 항목 {count}건이 추출되었으나 "가장 중요한 인사이트만 추출" 기준을 충족하지 못했습니다. 규칙 단계에서 해당 옵션을 해제하면 모든 항목이 유지됩니다.',
  },
  "extraction.progress.backToRules": {
    en: "Back to rules",
    ko: "규칙으로 돌아가기",
  },
  "extraction.progress.backToFiles": {
    en: "Back to files",
    ko: "파일로 돌아가기",
  },

  // Empty state: nothing extracted
  "extraction.progress.emptyTitle": {
    en: "No Q&A pairs could be extracted",
    ko: "추출할 수 있는 Q&A 항목이 없습니다",
  },
  "extraction.progress.emptyDescription": {
    en: "The files may not contain recognizable interview dialogue or notes. Review the files and try again.",
    ko: "파일에 인식 가능한 인터뷰 대화나 노트가 없을 수 있습니다. 파일을 확인한 후 다시 시도하십시오.",
  },

  // Error state
  "extraction.progress.errorTitle": { en: "Extraction failed", ko: "추출 실패" },
  "extraction.progress.errorFallback": {
    en: "An unexpected error occurred during extraction.",
    ko: "추출 중 예기치 않은 오류가 발생했습니다.",
  },
  "extraction.progress.retry": { en: "Retry", ko: "다시 시도" },
} satisfies Dict;
