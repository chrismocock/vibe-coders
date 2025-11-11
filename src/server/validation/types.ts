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
  run(input: { title: string; summary?: string; context?: Record<string, unknown> }): Promise<AgentResult>;
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

