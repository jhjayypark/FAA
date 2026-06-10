import type { Dict } from "@/lib/i18n";

/** Strings for the incidents module (list page, add dialog, location pickers). */
export const INCIDENTS = {
  // List page
  "incidents.title": { en: "Incidents", ko: "인시던트" },
  "incidents.description": {
    en: "Manage audit incidents, interviews, and findings.",
    ko: "감사 인시던트, 인터뷰, 추출 항목을 관리합니다.",
  },
  "incidents.add": { en: "Add Incident", ko: "인시던트 추가" },
  "incidents.empty.title": {
    en: "No incidents yet",
    ko: "등록된 인시던트가 없습니다",
  },
  "incidents.empty.description": {
    en: "Create an incident to start organizing interviews, evidence, and audit findings.",
    ko: "인시던트를 생성하여 인터뷰, 증거, 감사 추출 항목을 정리하십시오.",
  },

  // List row
  "incidents.row.created": { en: "Created {date}", ko: "생성 {date}" },
  "incidents.row.updated": { en: "Updated {time}", ko: "업데이트 {time}" },
  "incidents.row.sessions.one": { en: "{count} session", ko: "세션 {count}건" },
  "incidents.row.sessions.many": { en: "{count} sessions", ko: "세션 {count}건" },
  "incidents.row.moreLocations": { en: "+{count} more", ko: "외 {count}개" },
  "incidents.row.actions": { en: "Incident actions", ko: "인시던트 작업" },
  "incidents.row.delete": { en: "Delete incident", ko: "인시던트 삭제" },

  // Delete confirm dialog
  "incidents.delete.title": {
    en: "Delete incident?",
    ko: "인시던트를 삭제하시겠습니까?",
  },
  "incidents.delete.description": {
    en: 'This permanently deletes "{name}" along with all of its interview sessions and findings. This action cannot be undone.',
    ko: '"{name}" 인시던트와 모든 인터뷰 세션 및 추출 항목이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
  },

  // Toasts
  "incidents.toast.created": { en: "Incident created.", ko: "인시던트가 생성되었습니다." },
  "incidents.toast.deleted": { en: "Incident deleted.", ko: "인시던트가 삭제되었습니다." },
  "incidents.toast.locationAdded": { en: "Location added.", ko: "사업장이 추가되었습니다." },

  // Add Incident dialog
  "incidents.addDialog.description": {
    en: "Create an incident to organize interviews, evidence, and findings.",
    ko: "인터뷰, 증거, 추출 항목을 정리할 인시던트를 생성합니다.",
  },
  "incidents.form.name": { en: "Incident Name", ko: "인시던트 이름" },
  "incidents.form.namePlaceholder": {
    en: "Example: Inventory discrepancy, Carson warehouse",
    ko: "예: Carson 창고 재고 불일치",
  },
  "incidents.form.nameRequired": {
    en: "Incident name is required.",
    ko: "인시던트 이름은 필수 항목입니다.",
  },
  "incidents.form.context": { en: "Incident Context", ko: "인시던트 배경" },
  "incidents.form.contextPlaceholder": {
    en: "Describe what happened, why this audit is being opened, known background, relevant teams, timeline, or concerns.",
    ko: "발생 경위, 감사 착수 사유, 알려진 배경, 관련 부서, 타임라인, 우려 사항을 기재하십시오.",
  },
  "incidents.form.locations": { en: "Involved FNS Locations", ko: "관련 FNS 사업장" },
  "incidents.form.submit": { en: "Create Incident", ko: "인시던트 생성" },

  // Location multi-select
  "incidents.locations.select": { en: "Select locations", ko: "사업장 선택" },
  "incidents.locations.selected.one": {
    en: "{count} location selected",
    ko: "사업장 {count}개 선택됨",
  },
  "incidents.locations.selected.many": {
    en: "{count} locations selected",
    ko: "사업장 {count}개 선택됨",
  },
  "incidents.locations.searchPlaceholder": {
    en: "Search by name, city, or state",
    ko: "이름, 도시, 주로 검색",
  },
  "incidents.locations.empty": { en: "No locations found.", ko: "검색 결과가 없습니다." },
  "incidents.locations.add": { en: "Add location", ko: "사업장 추가" },
  "incidents.locations.remove": { en: "Remove {name}", ko: "{name} 제거" },
  "incidents.locations.group.us": { en: "United States", ko: "미국" },
  "incidents.locations.group.canada": { en: "Canada", ko: "캐나다" },
  "incidents.locations.group.mexico": { en: "Mexico", ko: "멕시코" },
  "incidents.locations.group.panama": { en: "Panama", ko: "파나마" },
  "incidents.locations.group.custom": { en: "Custom locations", ko: "직접 추가한 사업장" },

  // Add Location mini dialog
  "incidents.locations.dialogTitle": { en: "Add Location", ko: "사업장 추가" },
  "incidents.locations.dialogDescription": {
    en: "Add an FNS location that is not in the standard list.",
    ko: "표준 목록에 없는 FNS 사업장을 추가합니다.",
  },
  "incidents.locations.name": { en: "Location name", ko: "사업장 이름" },
  "incidents.locations.namePlaceholder": { en: "FNS - City, ST", ko: "FNS - City, ST" },
  "incidents.locations.nameRequired": {
    en: "Location name is required.",
    ko: "사업장 이름은 필수 항목입니다.",
  },
  "incidents.locations.address": { en: "Address", ko: "주소" },
  "incidents.locations.addressPlaceholder": {
    en: "Street, City, ST ZIP, US",
    ko: "Street, City, ST ZIP, US",
  },
  "incidents.locations.city": { en: "City", ko: "도시" },
  "incidents.locations.state": { en: "State", ko: "주" },
  "incidents.locations.statePlaceholder": { en: "CA", ko: "CA" },
  "incidents.locations.type": { en: "Type", ko: "유형" },
  "incidents.locations.typePlaceholder": { en: "Select type", ko: "유형 선택" },
  "incidents.locations.type.office": { en: "Office", ko: "사무실" },
  "incidents.locations.type.warehouse": { en: "Warehouse", ko: "창고" },
  "incidents.locations.type.logisticsHub": { en: "Logistics Hub", ko: "물류 허브" },
  "incidents.locations.type.unknown": { en: "Unknown", ko: "미상" },
} satisfies Dict;
