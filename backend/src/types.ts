/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScoreBoard {
  problemClarity: number;
  publicness: number;
  evidence: number;
  feasibility: number;
  alternativeSpecificity: number;
}

export interface CounterQuestion {
  type: string;
  message: string;
}

export interface Proposal {
  id?: string;
  originalText: string;
  field: string;
  coreProblem: string;
  affectedGroup: string;
  requestDirection: string;
  policyFeasibility: string;
  supplementPoint: string;
  scores: ScoreBoard;
  feedback: string;
  currentRound: number;
  counterQuestion: CounterQuestion;
  answers: { round: number; answer: string }[];
  isCompleted: boolean;
  finalCard?: FinalPolicyCard;
  createdAt: string;
}

export interface FinalPolicyCard {
  title: string;
  summary: string;
  problem: string;
  suggestion: string;
  expectedEffect: string;
  reviewPoints: string[];
}
