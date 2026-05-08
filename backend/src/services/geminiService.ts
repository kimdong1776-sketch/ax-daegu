/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Proposal, FinalPolicyCard } from "../types.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `
당신은 대구광역시의 정책 전문가이자 시민 의견 정제 도구입니다.
사용자의 일상 속 불편함을 행정기관이 검토할 수 있는 전문적인 '정책 언어'로 번역하는 역할을 수행합니다.

주의사항:
- "AI가 필터링한다", "판단한다", "반박한다"는 표현을 쓰지 마세요.
- 행정기관이 바로 쓸 수 있다고 과장하지 마세요.
- 대신 "시민 불편을 정책 언어로 번역한다", "예상 쟁점을 미리 보여준다", "시민이 스스로 제안을 구체화하도록 돕는다"는 관점을 유지하세요.
- 모든 응답은 친절하고 전문적인 한국어로 작성하세요.
`;

export async function startProposal(oneLineReview: string): Promise<Partial<Proposal>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `사용자의 불편함: "${oneLineReview}". 위를 분석하여 정책 초안을 만드세요. Round 1 예상 쟁점은 '예산 쟁점'으로 생성하세요.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING },
          coreProblem: { type: Type.STRING },
          affectedGroup: { type: Type.STRING },
          requestDirection: { type: Type.STRING },
          policyFeasibility: { type: Type.STRING },
          supplementPoint: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              problemClarity: { type: Type.NUMBER },
              publicness: { type: Type.NUMBER },
              evidence: { type: Type.NUMBER },
              feasibility: { type: Type.NUMBER },
              alternativeSpecificity: { type: Type.NUMBER },
            },
            required: ["problemClarity", "publicness", "evidence", "feasibility", "alternativeSpecificity"]
          },
          feedback: { type: Type.STRING },
          counterQuestion: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["type", "message"]
          }
        },
        required: ["field", "coreProblem", "affectedGroup", "requestDirection", "policyFeasibility", "supplementPoint", "scores", "feedback", "counterQuestion"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function respondToProposal(proposal: Proposal, answer: string): Promise<any> {
  const nextRound = proposal.currentRound + 1;
  let questionType = "";
  if (nextRound === 2) questionType = "형평성 쟁점";
  if (nextRound === 3) questionType = "효과성 쟁점";

  const prompt = `
  기존 제안: ${proposal.coreProblem} (${proposal.requestDirection})
  이전 라운드 점수: ${JSON.stringify(proposal.scores)}
  이전 라운드 답변들: ${JSON.stringify(proposal.answers)}
  이번 라운드(${proposal.currentRound}) 사용자 답변: "${answer}"
  
  수행: 점수 업데이트, 제안 구체화 요약(1문장), 피드백 작성. ${nextRound <= 3 ? `다음 라운드(${nextRound})의 '${questionType}' 생성.` : "마지막 라운드이므로 nextCounterQuestion 불필요."}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updatedScores: {
            type: Type.OBJECT,
            properties: {
              problemClarity: { type: Type.NUMBER },
              publicness: { type: Type.NUMBER },
              evidence: { type: Type.NUMBER },
              feasibility: { type: Type.NUMBER },
              alternativeSpecificity: { type: Type.NUMBER },
            },
            required: ["problemClarity", "publicness", "evidence", "feasibility", "alternativeSpecificity"]
          },
          improvedSummary: { type: Type.STRING },
          feedback: { type: Type.STRING },
          nextCounterQuestion: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              message: { type: Type.STRING }
            }
          }
        },
        required: ["updatedScores", "improvedSummary", "feedback"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function finalizeProposal(proposal: Proposal): Promise<FinalPolicyCard> {
  const prompt = `
  최종 정책 카드 생성.
  원본: ${proposal.originalText}
  누적 답변들: ${JSON.stringify(proposal.answers)}
  분석 요약: 분야-${proposal.field}, 핵심문제-${proposal.coreProblem}, 요구사항-${proposal.requestDirection}
  
  행정 문서 양식에 맞춰 격식 있고 명료하게 작성.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          problem: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          expectedEffect: { type: Type.STRING },
          reviewPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "summary", "problem", "suggestion", "expectedEffect", "reviewPoints"]
      }
    }
  });

  return JSON.parse(response.text);
}
