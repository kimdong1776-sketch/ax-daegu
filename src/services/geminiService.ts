import { GoogleGenAI } from "@google/genai";
import { Proposal } from "../types.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const MODEL_NAME = "gemini-2.5-flash-lite";

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function clampScore(value: unknown) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function normalizeScores(scores: any) {
  return {
    problemClarity: clampScore(scores?.problemClarity),
    publicness: clampScore(scores?.publicness),
    evidence: clampScore(scores?.evidence),
    feasibility: clampScore(scores?.feasibility),
    alternativeSpecificity: clampScore(scores?.alternativeSpecificity),
  };
}

function keepScores(scores: any) {
  return normalizeScores({
    problemClarity: scores?.problemClarity ?? 50,
    publicness: scores?.publicness ?? 70,
    evidence: scores?.evidence ?? 30,
    feasibility: scores?.feasibility ?? 50,
    alternativeSpecificity: scores?.alternativeSpecificity ?? 40,
  });
}

function preventScoreIncreaseWhenIrrelevant(
  previousScores: any,
  updatedScores: any
) {
  const prev = keepScores(previousScores);
  const next = normalizeScores(updatedScores);

  return {
    problemClarity: Math.min(next.problemClarity, prev.problemClarity),
    publicness: Math.min(next.publicness, prev.publicness),
    evidence: Math.min(next.evidence, prev.evidence),
    feasibility: Math.min(next.feasibility, prev.feasibility),
    alternativeSpecificity: Math.min(
      next.alternativeSpecificity,
      prev.alternativeSpecificity
    ),
  };
}

function fallbackStartProposal(oneLineReview: string) {
  return {
    field: "생활 불편 및 도시 행정",
    coreProblem: oneLineReview,
    affectedGroup: "해당 불편을 겪는 대구 시민",
    requestDirection: "시민 불편을 줄이기 위한 행정적 개선 방안 검토",
    policyFeasibility:
      "구체적인 위치, 시간대, 이용자 규모가 보완되면 정책화 가능성을 검토할 수 있습니다.",
    supplementPoint:
      "발생 위치, 시간대, 반복 빈도, 관련 사진 또는 사례가 추가되면 제안의 완성도가 높아집니다.",
    scores: {
      problemClarity: 50,
      publicness: 70,
      evidence: 30,
      feasibility: 50,
      alternativeSpecificity: 40,
    },
    feedback:
      "Gemini 호출이 일시적으로 실패하여 임시 분석 결과를 반환했습니다. 입력된 민원 내용을 기준으로 기본 정책 카드가 생성되었습니다.",
    counterQuestion: {
      type: "추가 정보 요청",
      message:
        "이 문제가 발생한 구체적인 위치, 시간대, 반복 빈도, 피해 사례 중 하나를 알려주실 수 있나요?",
    },
  };
}

export async function startProposal(oneLineReview: string) {
  if (process.env.USE_DUMMY_AI === "true") {
    return fallbackStartProposal(oneLineReview);
  }

  try {
    const prompt = `
당신은 대구광역시 시민 의견을 정책 제안 형태로 구조화하는 행정 정책 분석 AI입니다.

아래 시민 의견만을 근거로 분석하세요.
시민 의견에 없는 내용을 임의로 만들지 마세요.
사용자가 말한 불편 주제를 다른 정책 주제로 바꾸지 마세요.
예를 들어 사용자가 "버스 배차 간격"을 말했으면 공공자전거, CCTV, 보행 안전 등 다른 주제로 바꾸면 안 됩니다.
입력 내용이 짧거나 근거가 부족하면, 부족한 부분은 supplementPoint와 counterQuestion에서 물어보세요.

시민 의견:
${oneLineReview}

응답 규칙:
1. 반드시 JSON 객체 하나만 반환하세요.
2. 마크다운 코드블록을 사용하지 마세요.
3. 모든 score 값은 반드시 0 이상 100 이하의 정수로 작성하세요.
4. scores의 각 항목은 퍼센트 점수입니다.
5. field, coreProblem, affectedGroup, requestDirection은 반드시 시민 의견과 직접 관련된 내용이어야 합니다.
6. 입력이 모호하면 임의로 새로운 정책 주제를 만들지 말고, "추가 정보 필요"로 처리하세요.
7. 시민이 말하지 않은 다른 주제를 새로 만들지 마세요.

점수 기준:
- problemClarity: 문제 명확도, 0~100
- publicness: 공공성, 0~100
- evidence: 근거 충분성, 0~100
- feasibility: 실현 가능성, 0~100
- alternativeSpecificity: 대안 구체성, 0~100

반드시 아래 JSON 형식으로만 응답하세요.

{
  "field": "정책 분야",
  "coreProblem": "시민 의견에서 드러난 핵심 문제",
  "affectedGroup": "피해 대상",
  "requestDirection": "요구 방향",
  "policyFeasibility": "정책화 가능성",
  "supplementPoint": "정책 제안으로 발전시키기 위해 필요한 보완 정보",
  "scores": {
    "problemClarity": 0,
    "publicness": 0,
    "evidence": 0,
    "feasibility": 0,
    "alternativeSpecificity": 0
  },
  "feedback": "현재 제안에 대한 진단 피드백",
  "counterQuestion": {
    "type": "보완 질문 유형",
    "message": "사용자에게 물어볼 구체적인 보완 질문"
  }
}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text ?? "";
    const parsed = JSON.parse(extractJson(text));

    return {
      ...parsed,
      scores: normalizeScores(parsed.scores),
    };
  } catch (error) {
    console.error("Gemini startProposal failed. Using fallback:", error);
    return fallbackStartProposal(oneLineReview);
  }
}

export async function respondToProposal(proposal: Proposal, answer: string) {
  if (process.env.USE_DUMMY_AI === "true") {
    return {
      isRelevant: false,
      relevanceReason:
        "USE_DUMMY_AI 모드에서는 보완 답변의 실제 관련성을 AI로 판단하지 않으므로 점수를 올리지 않습니다.",
      updatedScores: keepScores(proposal.scores),
      improvedSummary:
        "더미 모드에서는 기존 정책 제안의 점수를 유지했습니다.",
      feedback:
        "현재는 더미 모드이므로 정책 완성도 점수를 임의로 올리지 않습니다. 실제 관련성 판단은 AI 호출 활성화 후 수행됩니다.",
      nextCounterQuestion: {
        type: "구체성 보완",
        message:
          "정책 제안을 보완할 수 있도록 문제 발생 장소, 시간대, 피해 사례, 원하는 해결 방향 중 하나를 구체적으로 알려주실 수 있나요?",
      },
    };
  }

  try {
    const prompt = `
당신은 대구광역시 시민 정책 제안을 보완하는 행정 정책 분석 AI입니다.

당신의 가장 중요한 역할은 사용자의 보완 답변이 기존 정책 제안을 실제로 개선하는지 판단하는 것입니다.

기존 정책 제안:
${JSON.stringify(proposal, null, 2)}

사용자 보완 답변:
${answer}

판단 기준:
1. 사용자 보완 답변이 기존 정책 제안의 문제, 위치, 시간대, 피해 대상, 피해 사례, 수치, 원인, 해결 방향, 예산 고려, 기대 효과 중 하나 이상을 구체적으로 보완하면 관련 있는 답변입니다.
2. 사용자 보완 답변이 기존 정책 제안과 주제가 다르거나, 농담이거나, 감정 표현만 있거나, 의미 없는 문장이거나, 단순한 맞장구라면 관련 없는 답변입니다.
3. 관련 없는 답변이면 isRelevant를 false로 설정하세요.
4. 관련 없는 답변이면 updatedScores는 기존 scores보다 절대 올라가면 안 됩니다. 기존 scores와 같거나 더 낮아야 합니다.
5. 관련 있는 답변이라도 구체적인 정보가 거의 없으면 점수를 크게 올리지 마세요.
6. 점수를 올릴 수 있는 경우는 답변이 정책 제안의 근거, 구체성, 실현 가능성, 대안 구체성 중 하나를 실제로 강화할 때만입니다.
7. 기존 정책 주제를 다른 주제로 바꾸지 마세요.
8. 사용자가 기존 주제와 관계없는 새 주제를 말하면 기존 정책 제안의 점수를 올리지 마세요.
9. 모든 점수는 반드시 0 이상 100 이하의 정수로 작성하세요.
10. 반드시 JSON 객체 하나만 반환하세요.
11. 마크다운 코드블록을 사용하지 마세요.

기존 scores:
${JSON.stringify(proposal.scores, null, 2)}

반드시 아래 JSON 형식으로만 응답하세요.

{
  "isRelevant": true,
  "relevanceReason": "사용자 답변이 기존 정책 제안과 관련 있는지 판단한 이유",
  "updatedScores": {
    "problemClarity": 0,
    "publicness": 0,
    "evidence": 0,
    "feasibility": 0,
    "alternativeSpecificity": 0
  },
  "improvedSummary": "보완 답변을 반영한 개선 요약",
  "feedback": "보완 답변에 대한 피드백",
  "nextCounterQuestion": {
    "type": "보완 질문 유형",
    "message": "다음 보완 질문"
  }
}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text ?? "";
    const parsed = JSON.parse(extractJson(text));

    const normalizedUpdatedScores = normalizeScores(parsed.updatedScores);

    if (parsed.isRelevant === false) {
      return {
        ...parsed,
        updatedScores: preventScoreIncreaseWhenIrrelevant(
          proposal.scores,
          normalizedUpdatedScores
        ),
      };
    }

    return {
      ...parsed,
      isRelevant: parsed.isRelevant ?? true,
      relevanceReason:
        parsed.relevanceReason ??
        "보완 답변이 기존 정책 제안과 관련 있는 것으로 판단되었습니다.",
      updatedScores: normalizedUpdatedScores,
    };
  } catch (error) {
    console.error("Gemini respondToProposal failed. Keeping scores:", error);

    return {
      isRelevant: false,
      relevanceReason:
        "AI 응답 생성에 실패하여 보완 답변의 관련성을 안정적으로 판단할 수 없습니다.",
      updatedScores: keepScores(proposal.scores),
      improvedSummary:
        "AI 응답 생성에 실패하여 기존 정책 제안 점수를 유지했습니다.",
      feedback:
        "현재 보완 답변을 안정적으로 분석할 수 없어 정책 완성도 점수는 올리지 않았습니다. 구체적인 위치, 시간대, 피해 사례, 원하는 해결 방향을 작성하면 제안 보완에 도움이 됩니다.",
      nextCounterQuestion: {
        type: "구체성 보완",
        message:
          "정책 제안을 보완할 수 있도록 이 문제가 발생한 장소, 시간대, 피해 사례, 원하는 해결 방향 중 하나를 구체적으로 알려주실 수 있나요?",
      },
    };
  }
}

export async function finalizeProposal(proposal: Proposal) {
  if (process.env.USE_DUMMY_AI === "true") {
    return {
      title: "시민 불편 개선을 위한 정책 제안",
      category: proposal.field ?? "생활 불편",
      summary:
        "시민이 제기한 생활 속 불편 사항을 바탕으로 행정적 개선 방향을 제안합니다.",
      problem: proposal.coreProblem ?? proposal.originalText ?? "시민 불편 발생",
      target: proposal.affectedGroup ?? "대구 시민",
      requestDirection:
        proposal.requestDirection ?? "시민 불편을 줄이기 위한 개선 방안 검토",
      feasibility:
        proposal.policyFeasibility ??
        "구체적인 근거와 예산 검토를 통해 정책화 가능성을 판단할 수 있습니다.",
      supplementPoint:
        proposal.supplementPoint ??
        "위치, 시간대, 반복 빈도 등 구체적 근거가 추가되면 좋습니다.",
      finalMessage:
        "본 제안은 시민의 일상적 불편을 바탕으로 공공 문제를 구체화한 정책 제안입니다.",
    };
  }

  try {
    const prompt = `
당신은 대구광역시 시민 정책 제안을 최종 정책 카드로 정리하는 행정 문서 작성 AI입니다.

아래 정책 제안 내용만을 근거로 최종 정책 카드를 작성하세요.
기존 정책 주제를 다른 주제로 바꾸지 마세요.
시민 의견에 없는 내용을 과도하게 만들어내지 마세요.
정책 카드 문장은 행정 제안서처럼 명확하고 간결하게 작성하세요.

정책 제안:
${JSON.stringify(proposal, null, 2)}

응답 규칙:
1. 반드시 JSON 객체 하나만 반환하세요.
2. 마크다운 코드블록을 사용하지 마세요.
3. 모든 항목은 한국어로 작성하세요.
4. summary는 2문장 이내로 작성하세요.
5. finalMessage는 제안의 의의와 기대 효과를 간단히 정리하세요.

반드시 아래 JSON 형식으로만 응답하세요.

{
  "title": "최종 제안 제목",
  "category": "분야",
  "summary": "요약",
  "problem": "문제",
  "target": "대상",
  "requestDirection": "요구 방향",
  "feasibility": "실현 가능성",
  "supplementPoint": "보완 포인트",
  "finalMessage": "최종 메시지"
}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text ?? "";
    return JSON.parse(extractJson(text));
  } catch (error) {
    console.error("Gemini finalizeProposal failed. Using fallback:", error);

    return {
      title: "시민 불편 개선을 위한 정책 제안",
      category: proposal.field ?? "생활 불편",
      summary:
        "시민이 제기한 생활 속 불편 사항을 바탕으로 행정적 개선 방향을 제안합니다.",
      problem: proposal.coreProblem ?? proposal.originalText ?? "시민 불편 발생",
      target: proposal.affectedGroup ?? "대구 시민",
      requestDirection:
        proposal.requestDirection ?? "시민 불편을 줄이기 위한 개선 방안 검토",
      feasibility:
        proposal.policyFeasibility ??
        "구체적인 근거와 예산 검토를 통해 정책화 가능성을 판단할 수 있습니다.",
      supplementPoint:
        proposal.supplementPoint ??
        "위치, 시간대, 반복 빈도 등 구체적 근거가 추가되면 좋습니다.",
      finalMessage:
        "본 제안은 시민의 일상적 불편을 바탕으로 공공 문제를 구체화한 정책 제안입니다.",
    };
  }
}