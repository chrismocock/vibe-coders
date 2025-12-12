const DEFAULT_RATIONALE = 'No rationale provided';

export const IDEATE_PILLARS = [
  { id: 'audienceFit', label: 'Audience Fit', weight: 0.2 },
  { id: 'competition', label: 'Competition', weight: 0.2 },
  { id: 'marketDemand', label: 'Market Demand', weight: 0.25 },
  { id: 'feasibility', label: 'Feasibility', weight: 0.15 },
  { id: 'pricingPotential', label: 'Pricing Potential', weight: 0.2 },
] as const;

export type IdeatePillarId = (typeof IDEATE_PILLARS)[number]['id'];

export const IDEATE_PILLAR_LABELS: Record<IdeatePillarId, string> = IDEATE_PILLARS.reduce(
  (acc, pillar) => {
    acc[pillar.id] = pillar.label;
    return acc;
  },
  {} as Record<IdeatePillarId, string>,
);

export const IDEATE_PILLAR_WEIGHTS: Record<IdeatePillarId, number> = IDEATE_PILLARS.reduce(
  (acc, pillar) => {
    acc[pillar.id] = pillar.weight;
    return acc;
  },
  {} as Record<IdeatePillarId, number>,
);

export interface IdeatePillarScore {
  score: number;
  rationale: string;
}

export type IdeatePillarScores = Record<IdeatePillarId, IdeatePillarScore>;

export interface IdeatePillarSnapshot extends IdeatePillarScore {
  pillar: IdeatePillarId;
  label: string;
  weight: number;
}

export interface IdeateInitialFeedbackData {
  recommendation: 'build' | 'revise' | 'drop';
  overallConfidence: number;
  scores: IdeatePillarScores;
}

export function clampIdeateScore(score: unknown, fallback = 50): number {
  if (typeof score === 'number' && Number.isFinite(score)) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  return fallback;
}

export function sanitizeRationale(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : DEFAULT_RATIONALE;
  }
  return DEFAULT_RATIONALE;
}

export function createDefaultPillarScores(): IdeatePillarScores {
  return IDEATE_PILLARS.reduce((acc, pillar) => {
    acc[pillar.id] = { score: 50, rationale: DEFAULT_RATIONALE };
    return acc;
  }, {} as IdeatePillarScores);
}

export function normalizeIdeatePillarScores(rawScores: unknown): IdeatePillarScores {
  const normalized = createDefaultPillarScores();
  if (!rawScores || typeof rawScores !== 'object') {
    return normalized;
  }

  for (const pillar of IDEATE_PILLARS) {
    const current = (rawScores as Record<string, unknown>)[pillar.id];
    if (current && typeof current === 'object') {
      normalized[pillar.id] = {
        score: clampIdeateScore((current as IdeatePillarScore).score),
        rationale: sanitizeRationale((current as IdeatePillarScore).rationale),
      };
    }
  }

  return normalized;
}

export function buildPillarSnapshots(scores: IdeatePillarScores): IdeatePillarSnapshot[] {
  return IDEATE_PILLARS.map((pillar) => ({
    pillar: pillar.id,
    label: pillar.label,
    weight: pillar.weight,
    score: clampIdeateScore(scores[pillar.id]?.score),
    rationale: sanitizeRationale(scores[pillar.id]?.rationale),
  }));
}

export function calculateIdeateConfidence(scores: IdeatePillarScores): number {
  let total = 0;
  for (const pillar of IDEATE_PILLARS) {
    total += pillar.weight * clampIdeateScore(scores[pillar.id]?.score);
  }
  return Math.round(total);
}

function deriveRecommendation(confidence: number): IdeateInitialFeedbackData['recommendation'] {
  if (confidence >= 70) return 'build';
  if (confidence >= 40) return 'revise';
  return 'drop';
}

export function normalizeInitialFeedbackData(raw: unknown): IdeateInitialFeedbackData {
  const parsed = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const normalizedScores = normalizeIdeatePillarScores(parsed.scores);
  const calculatedConfidence = calculateIdeateConfidence(normalizedScores);

  const normalized: IdeateInitialFeedbackData = {
    recommendation: deriveRecommendation(calculatedConfidence),
    overallConfidence: calculatedConfidence,
    scores: normalizedScores,
  };

  return normalized;
}

export type ImprovementDirectionConfidence = 'low' | 'medium' | 'high';

export interface ImprovementDirection {
  id: string;
  title: string;
  description: string;
  pillar: IdeatePillarId;
  confidence: ImprovementDirectionConfidence;
}
