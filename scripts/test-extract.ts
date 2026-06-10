import { runMockExtraction } from "@/lib/extraction/mock-extractor";
import type { Incident, UploadedInterviewFile } from "@/lib/types";
import { DEFAULT_EXTRACTION_SETTINGS } from "@/lib/types";
import * as fs from "fs";

const transcript = fs.readFileSync("./public/samples/김민수_인터뷰_녹취록.txt", "utf8");
const notes = fs.readFileSync("./public/samples/수기노트_김민수_면담.md", "utf8");

const incident: Incident = {
  id: "inc1",
  name: "Moonachie 창고 5월 재고 불일치",
  context: "NJ Moonachie 창고에서 5월 재고 실사 결과 72박스 차이 발생. 무단 출고 의심.",
  involvedLocationIds: ["moonachie-nj"],
  createdAt: "", updatedAt: "", overviewEntries: [], interviewSessions: [],
};

const files: UploadedInterviewFile[] = [
  { id: "f1", fileName: "김민수_인터뷰_녹취록.txt", fileType: "txt", contentText: transcript, sourceType: "transcript" },
  { id: "f2", fileName: "수기노트_김민수_면담.md", fileType: "md", contentText: notes, sourceType: "manual_notes" },
];

const result = runMockExtraction({ incident, overviewEntries: [], uploadedFiles: files, settings: DEFAULT_EXTRACTION_SETTINGS });

console.log("interviewee:", result.intervieweeName);
console.log("total QA:", result.qaItems.length);
const byImp: Record<string, number> = {};
let badOffsets = 0;
for (const qa of result.qaItems) {
  byImp[qa.importance] = (byImp[qa.importance] ?? 0) + 1;
  for (const c of qa.sourceCitations) {
    const file = files.find(f => f.id === c.fileId)!;
    const slice = file.contentText.slice(c.startChar!, c.startChar! + c.quote.length);
    if (slice !== c.quote) { badOffsets++; console.log("OFFSET MISMATCH:", JSON.stringify(c.quote.slice(0,40)), "vs", JSON.stringify(slice.slice(0,40))); }
  }
}
console.log("importance distribution:", byImp);
console.log("offset mismatches:", badOffsets);
console.log("\n--- first 5 items ---");
for (const qa of result.qaItems.slice(0, 5)) {
  console.log(`[${qa.importance}]${qa.timestampLabel ? ` (${qa.timestampLabel})` : ""} Q: ${qa.question}`);
  console.log(`   A: ${qa.answer.slice(0, 80)}`);
  console.log(`   reason: ${qa.importanceReason} | citations: ${qa.sourceCitations.length} | inReport: ${qa.includedInReport}`);
}
