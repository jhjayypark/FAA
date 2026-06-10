import type { Dict } from "@/lib/i18n";

/** Strings for the incident-detail module. Populated by the module owner. */
export const INCIDENT_DETAIL = {
  // Not-found state
  "incidentDetail.notFound.title": {
    en: "Incident not found",
    ko: "인시던트를 찾을 수 없습니다",
  },
  "incidentDetail.notFound.description": {
    en: "This incident may have been deleted or the link is incorrect.",
    ko: "인시던트가 삭제되었거나 링크가 올바르지 않을 수 있습니다.",
  },
  "incidentDetail.notFound.back": {
    en: "Back to Incidents",
    ko: "인시던트 목록으로",
  },

  // Header
  "incidentDetail.backToIncidents": { en: "Incidents", ko: "인시던트" },
  "incidentDetail.meta.createdUpdated": {
    en: "Created {created} · Updated {updated}",
    ko: "{created} 생성 · {updated} 수정",
  },
  "incidentDetail.context.label": { en: "Context", ko: "배경" },
  "incidentDetail.context.showMore": { en: "Show more", ko: "더 보기" },
  "incidentDetail.context.showLess": { en: "Show less", ko: "접기" },

  // Tabs
  "incidentDetail.tabs.overview": { en: "Overview", ko: "개요" },
  "incidentDetail.tabs.interview": { en: "Interview", ko: "인터뷰" },

  // Entry composer and shared form fields
  "incidentDetail.composer.title": { en: "New Entry", ko: "새 항목" },
  "incidentDetail.composer.add": { en: "Add Entry", ko: "항목 추가" },
  "incidentDetail.form.type": { en: "Type", ko: "유형" },
  "incidentDetail.form.title": { en: "Title", ko: "제목" },
  "incidentDetail.form.titlePlaceholder": {
    en: "Add interview date, related person, timeline note, or incident detail...",
    ko: "인터뷰 일정, 관련 인물, 타임라인 메모, 사건 세부 내용을 입력하세요...",
  },
  "incidentDetail.form.dateTime": { en: "Date and time", ko: "날짜 및 시간" },
  "incidentDetail.form.people": { en: "People", ko: "관련 인물" },
  "incidentDetail.form.peopleHelp": {
    en: "Comma-separated names.",
    ko: "이름을 쉼표로 구분하여 입력합니다.",
  },
  "incidentDetail.form.role": { en: "Role or team", ko: "역할 또는 팀" },
  "incidentDetail.form.rolePlaceholder": {
    en: "Warehouse supervisor, inbound team",
    ko: "창고 관리자, 입고팀",
  },
  "incidentDetail.form.details": { en: "Details", ko: "세부 내용" },

  // Entry types
  "incidentDetail.entryType.interview": { en: "Interview", ko: "인터뷰" },
  "incidentDetail.entryType.person": { en: "Person", ko: "인물" },
  "incidentDetail.entryType.timeline": { en: "Timeline", ko: "타임라인" },
  "incidentDetail.entryType.note": { en: "Note", ko: "메모" },

  // Entries list
  "incidentDetail.entries.emptyTitle": {
    en: "No entries yet",
    ko: "아직 항목이 없습니다",
  },
  "incidentDetail.entries.emptyDescription": {
    en: "Capture interview schedules, people involved, and timeline notes as the investigation develops.",
    ko: "조사 진행에 따라 인터뷰 일정, 관련 인물, 타임라인 메모를 기록할 수 있습니다.",
  },
  "incidentDetail.entries.rowActions": { en: "Entry actions", ko: "항목 작업" },
  "incidentDetail.deleteEntry.title": {
    en: "Delete entry?",
    ko: "항목을 삭제하시겠습니까?",
  },
  "incidentDetail.deleteEntry.description": {
    en: 'This will permanently remove "{title}" from the incident overview. This action cannot be undone.',
    ko: '"{title}" 항목이 인시던트 개요에서 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
  },
  "incidentDetail.toast.entryAdded": {
    en: "Entry added.",
    ko: "항목이 추가되었습니다.",
  },
  "incidentDetail.toast.entryUpdated": {
    en: "Entry updated.",
    ko: "항목이 수정되었습니다.",
  },
  "incidentDetail.toast.entryDeleted": {
    en: "Entry deleted.",
    ko: "항목이 삭제되었습니다.",
  },

  // Interview tab feature cards
  "incidentDetail.prepare.title": {
    en: "Prepare Interview Questions",
    ko: "인터뷰 질문 준비",
  },
  "incidentDetail.prepare.comingSoon": { en: "Coming Soon", ko: "제공 예정" },
  "incidentDetail.prepare.description": {
    en: "Generate a structured Korean interview questionnaire based on incident context, involved locations, and prior findings.",
    ko: "인시던트 맥락, 관련 사업장, 기존 추출 항목을 바탕으로 구조화된 한국어 인터뷰 질문지를 생성합니다.",
  },
  "incidentDetail.prepare.action": {
    en: "Prepare Questions",
    ko: "질문 준비",
  },
  "incidentDetail.extract.title": {
    en: "Extract Interview Insights",
    ko: "인터뷰 인사이트 추출",
  },
  "incidentDetail.extract.description": {
    en: "Upload Korean interview transcripts and/or manual notes to extract factual Q&A pairs, source citations, and report-ready findings.",
    ko: "한국어 인터뷰 녹취록이나 수기 메모를 업로드하여 사실 기반 Q&A 항목, 출처 인용, 보고서에 바로 활용할 수 있는 추출 항목을 생성합니다.",
  },
  "incidentDetail.extract.action": { en: "Start Extraction", ko: "추출 시작" },

  // Interview sessions section
  "incidentDetail.sessions.title": {
    en: "Interview Sessions",
    ko: "인터뷰 세션",
  },
  "incidentDetail.sessions.emptyTitle": {
    en: "No interview sessions yet",
    ko: "아직 인터뷰 세션이 없습니다",
  },
  "incidentDetail.sessions.emptyDescription": {
    en: "Extracted interviews will appear here.",
    ko: "추출된 인터뷰가 여기에 표시됩니다.",
  },
  "incidentDetail.session.files.one": { en: "{count} file", ko: "파일 {count}개" },
  "incidentDetail.session.files.many": {
    en: "{count} files",
    ko: "파일 {count}개",
  },
  "incidentDetail.session.qaCount": { en: "{count} Q&A", ko: "Q&A {count}건" },
  "incidentDetail.session.highCount": {
    en: "{count} High",
    ko: "High {count}건",
  },
  "incidentDetail.session.rowActions": {
    en: "Session actions",
    ko: "세션 작업",
  },
  "incidentDetail.unknownInterviewee": {
    en: "Unknown interviewee",
    ko: "면담자 미상",
  },
  "incidentDetail.deleteSession.title": {
    en: "Delete interview session?",
    ko: "인터뷰 세션을 삭제하시겠습니까?",
  },
  "incidentDetail.deleteSession.description": {
    en: "This will permanently remove the session for {name}, including its uploaded files and all extracted Q&A items. This action cannot be undone.",
    ko: "{name}의 인터뷰 세션이 업로드된 파일과 모든 추출 Q&A 항목을 포함하여 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
  },
  "incidentDetail.toast.sessionDeleted": {
    en: "Interview session deleted.",
    ko: "인터뷰 세션이 삭제되었습니다.",
  },
} satisfies Dict;
