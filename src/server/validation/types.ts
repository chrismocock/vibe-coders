export type AgentScoreKey =
  | 'marketDemand' | 'competition' | 'audienceFit' | 'feasibility' | 'pricingPotential';

export interface AgentResult {
  key: AgentScoreKey;
  score: number; // 0-100
  rationale: string;
  meta?: Record<string, unknown>;
}

export interface ValidationAgent {
  id: string;
  label: string;
  weight: number; // 0-1
  run(input: { title: string; summary?: string; aiReview?: string; context?: Record<string, unknown> }): Promise<AgentResult>;
}

export interface ValidationReport {
  id?: string;
  projectId: string;
  ideaTitle: string;
  ideaSummary?: string;
  scores: Record<AgentScoreKey, number>;
  overallConfidence: number; // 0-100
  recommendation: 'build' | 'revise' | 'drop';
  rationales: Partial<Record<AgentScoreKey, string>>;
  agentDetails?: Record<string, unknown>;
}

export interface AgentMetadata {
  model: string;
  tokens?: number;
  duration?: number;
  signals?: string[];
}

export interface SectionResult {
  score: number; // 0-100
  summary: string; // Key insights and analysis
  actions: string[]; // 3-5 actionable design recommendations
  updated_at?: string; // ISO timestamp
}

export type ValidationSection = 
  | 'overview' 
  | 'problem' 
  | 'market' 
  | 'competition' 
  | 'audience' 
  | 'feasibility' 
  | 'pricing' 
  | 'go-to-market';

