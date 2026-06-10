export type Importance = "High" | "Medium" | "Low";

export type FNSLocationType = "Office" | "Warehouse" | "Logistics Hub" | "Unknown";

export type FNSLocation = {
  id: string;
  name: string; // Example: "FNS - New Jersey / Moonachie"
  address: string;
  city: string;
  state: string;
  type?: FNSLocationType;
  isCustom?: boolean;
};

export type OverviewEntryType = "interview" | "person" | "note" | "timeline";

export type OverviewEntry = {
  id: string;
  type: OverviewEntryType;
  title: string;
  description?: string;
  dateTime?: string; // ISO string
  people?: string[];
  createdAt: string;
};

export type UploadedFileSourceType = "transcript" | "manual_notes" | "unknown";

export type UploadedInterviewFile = {
  id: string;
  fileName: string;
  fileType: string; // extension: txt | md | docx | pdf | ...
  contentText: string;
  sourceType: UploadedFileSourceType;
};

export type ExtractionSettings = {
  stylePreset: "strict_factual";
  importantOnly: boolean;
  rules: string[];
};

export type SourceCitation = {
  fileId: string;
  fileName: string;
  quote: string;
  startChar?: number;
  endChar?: number;
  pageNumber?: number;
  confidence: number; // 0..1
};

export type QAItem = {
  id: string;
  question: string;
  answer: string;
  importance: Importance;
  importanceReason?: string;
  includedInReport: boolean;
  isManuallyEdited: boolean;
  sourceCitations: SourceCitation[];
  orderIndex: number;
  timestampLabel?: string;
};

export type InterviewSession = {
  id: string;
  incidentId: string;
  intervieweeName?: string;
  interviewDate?: string;
  uploadedFiles: UploadedInterviewFile[];
  extractionSettings: ExtractionSettings;
  qaItems: QAItem[];
  createdAt: string;
};

export type Incident = {
  id: string;
  name: string;
  context?: string;
  involvedLocationIds: string[];
  createdAt: string;
  updatedAt: string;
  overviewEntries: OverviewEntry[];
  interviewSessions: InterviewSession[];
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

/** Shape returned by the extraction pipeline before items are persisted. */
export type ExtractedQAItem = Omit<QAItem, "id" | "orderIndex" | "isManuallyEdited">;

export type ExtractionResult = {
  intervieweeName: string | null;
  qaItems: ExtractedQAItem[];
};

export type ReportOptions = {
  title: string;
  themeColor: string; // hex
  includeIncidentContext: boolean;
  includeLocations: boolean;
  includeImportanceBadges: boolean;
  includeCitations: boolean;
  includeAppendix: boolean;
  templateFileName?: string; // stored only; styling support is a future version
};

export const MANDATORY_EXTRACTION_RULES = [
  "없는 말 절대 추가 금지",
  "추정 금지",
  "녹취에 없는 내용은 쓰지 말고, 애매하면 \"모름\" 또는 제외",
  "사실 위주로 작성",
  "인터뷰어 질문이 어떻게 적혀있든 전부 Q 형식으로 통일",
] as const;

export const DEFAULT_EXTRACTION_SETTINGS: ExtractionSettings = {
  stylePreset: "strict_factual",
  importantOnly: false,
  rules: [...MANDATORY_EXTRACTION_RULES],
};

export const UNKNOWN_INTERVIEWEE = "Unknown interviewee";
