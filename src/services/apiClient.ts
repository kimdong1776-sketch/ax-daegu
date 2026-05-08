import { AIAnalysis } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// 백엔드 객체 데이터를 프론트엔드 배열 형태로 변환
function scoresToMetrics(scores: any) {
  return [
    { label: "문제 명확도", value: Number(scores?.problemClarity ?? 0), increment: 0, icon: "target" },
    { label: "공공성", value: Number(scores?.publicness ?? 0), increment: 0, icon: "public" },
    { label: "근거 충분성", value: Number(scores?.evidence ?? 0), increment: 0, icon: "library_books" },
    { label: "실현 가능성", value: Number(scores?.feasibility ?? 0), increment: 0, icon: "build" },
    { label: "대안 구체성", value: Number(scores?.alternativeSpecificity ?? 0), increment: 0, icon: "lightbulb" },
  ];
}

// 백엔드 전체 데이터를 프론트엔드 AIAnalysis 구조로 변환
export function convertBackendToAnalysis(data: any): AIAnalysis {
  const metrics = scoresToMetrics(data.scores);
  const structuringLevel = Math.round(
    metrics.reduce((sum, metric) => sum + metric.value, 0) / (metrics.length || 1)
  );
  const safeStructuringLevel = Math.max(0, Math.min(100, structuringLevel));

  return {
    structuringLevel: safeStructuringLevel,
    diagnostic: data.feedback ?? "시민님의 소중한 의견을 정책 제안서로 다듬어 보았습니다.",
    riskOfRejection: Number(data.scores?.evidence ?? 0) < 5,
    draft: {
      category: data.field ?? "기타",
      problem: data.coreProblem ?? "",
      target: data.affectedGroup ?? "",
      direction: data.requestDirection ?? "",
      possibility: data.policyFeasibility ?? "",
    },
    metrics: metrics,
  };
}

export function getCounterQuestionText(counterQuestion: any) {
  if (!counterQuestion) return "더 멋진 제안서가 될 수 있도록 몇 가지만 더 여쭤볼게요.";
  if (typeof counterQuestion === "string") return counterQuestion;
  return counterQuestion.message ?? "더 멋진 제안서가 될 수 있도록 몇 가지만 더 여쭤볼게요.";
}

export const apiClient = {
  async startProposal(oneLineReview: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: JSON.stringify({ oneLineReview }),
    });

    if (!response.ok) throw new Error("Failed to start proposal");
    const data = await response.json();

    return {
      proposalId: data.proposalId, // 백엔드 이름에 맞춤
      analysis: convertBackendToAnalysis(data), // 구조 변환 적용
      initialQuestion: getCounterQuestionText(data.counterQuestion),
      raw: data,
    };
  },

  async respondToProposal(proposalId: string, answer: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) throw new Error("Failed to respond to proposal");
    return response.json();
  },

  async finalizeProposal(proposalId: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/finalize`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    });

    if (!response.ok) throw new Error("Failed to finalize proposal");
    return response.json();
  },

  async getProposals() {
    const response = await fetch(`${API_BASE_URL}/api/proposals`, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch proposals");
    return response.json();
  },
};
