import { answerQuestion } from "@/lib/assistant/answer";
import type { Incident } from "@/lib/types";

const incident: Incident = {
  id: "i1", name: "Moonachie 재고 불일치", context: "재고 차이",
  involvedLocationIds: ["moonachie-nj"], createdAt: "", updatedAt: "",
  overviewEntries: [],
  interviewSessions: [{
    id: "s1", incidentId: "i1", intervieweeName: "김민수", uploadedFiles: [],
    extractionSettings: { stylePreset: "strict_factual", importantOnly: false, rules: [] },
    createdAt: "",
    qaItems: [{
      id: "q1", question: "출고 기록은 누가 입력합니까?",
      answer: "박지현 매니저가 대신 입력한 경우가 있었습니다.",
      importance: "High", includedInReport: true, isManuallyEdited: false,
      sourceCitations: [{ fileId: "f1", fileName: "녹취록.txt", quote: "박지현 매니저가", confidence: 0.9 }],
      orderIndex: 0,
    }],
  }],
};

(async () => {
  console.log("--- 연봉 (partial match) ---");
  console.log(await answerQuestion({ incident, question: "박지현 매니저의 연봉이 얼마야?" }));
  console.log("--- 날씨 (no match) ---");
  console.log(await answerQuestion({ incident, question: "내일 날씨 알려줘" }));
})();
