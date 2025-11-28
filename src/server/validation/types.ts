export type AgentScoreKey =
  | 'marketDemand'
  | 'competition'
  | 'audienceFit'
  | 'feasibility'
  | 'pricingPotential';

export interface AgentResult {
  key: AgentScoreKey;
  score: number; // 0-100
  rationale: string;
  meta?: Record<string, unknown>;
}

export interface Persona {
  name: string;
  age?: number;
  role?: string;
  description?: string;
  goals: string[];
  pains: string[];
  triggers: string[];
  objections: string[];
  solutionFit: string[];
  neededFeatures: string[];
}

export interface FeatureMap {
  must: string[];
  should: string[];
  could: string[];
  avoid: string[];
}

export interface IdeaEnhancement {
  strongerPositioning: string;
  uniqueAngle: string;
  differentiators: string[];
  featureAdditions: string[];
  betterTargetAudiences: string[];
  pricingStrategy: string;
  whyItWins: string;
}

export interface PersonaReaction {
  personaName: string;
  reaction: string;
  likes: string[];
  dislikes: string[];
  confusionPoints: string[];
  requestedFeatures: string[];
}

export interface OpportunityScoreBreakdown {
  marketMomentum: number;
  audienceEnthusiasm: number;
  feasibility: number;
}

export interface OpportunityScore {
  score: number;
  breakdown: OpportunityScoreBreakdown;
  rationale: string;
}

export interface RiskRadar {
  market: number;
  competition: number;
  technical: number;
  monetisation: number;
  goToMarket: number;
  commentary?: string[];
}

export interface DesignBrief {
  personas: Persona[];
  coreProblems: string[];
  featureSet: FeatureMap;
  positioning: string;
  pricing: string;
  competitorGaps: string[];
  valueProposition: string;
  messaging: string[];
  initialUIIdeas: string[];
}

export interface AnalysisFeedItem {
  id: string;
  message: string;
  status?: 'pending' | 'running' | 'completed';
  timestamp?: string;
}

export interface SectionInsight {
  discoveries: string;
  meaning: string;
  impact: string;
  recommendations: string;
}

export interface SectionSuggestions {
  features: string[];
  positioning: string[];
  audience: string[];
  copy: string[];
}

export interface SectionDeepDive {
  summary: string;
  signals: string[];
  researchFindings: string[];
  competitorInsights: string[];
  pricingAngles: string[];
  audienceAngles: string[];
  featureOpportunities: string[];
  nextSteps: string[];
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
  opportunityScore?: OpportunityScore | null;
  riskRadar?: RiskRadar | null;
  personas?: Persona[] | null;
  featureMap?: FeatureMap | null;
  ideaEnhancement?: IdeaEnhancement | null;
  personaReactions?: Partial<Record<ValidationSection, PersonaReaction[]>> | null;
  designBrief?: DesignBrief | null;
  analysisFeed?: AnalysisFeedItem[] | null;
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
  insightBreakdown?: SectionInsight;
  suggestions?: SectionSuggestions;
  opportunityMap?: FeatureMap;
  personaHighlights?: PersonaReaction[];
  deepDive?: SectionDeepDive;
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

