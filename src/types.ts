export type Screen = 'SPLASH' | 'INPUT' | 'LOADING' | 'RESULT' | 'REFINE' | 'SUCCESS' | 'SUBMITTED';

export interface PolicyMetric {
  label: string;
  value: number;
  increment: number;
  icon: string;
}

export interface PolicyDraft {
  category: string;
  problem: string;
  target: string;
  direction: string;
  possibility: string;
}

export interface AIAnalysis {
  structuringLevel: number;
  metrics: PolicyMetric[];
  draft: PolicyDraft;
  diagnostic: string;
  riskOfRejection: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  round?: number;
  topic?: string;
  proposalId?: string;
}
