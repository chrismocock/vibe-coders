import { z } from 'zod';
import { callJsonPrompt } from '@/server/validation/openai';
import { AIProductOverview } from '@/server/validation/types';

export type PillarName = 'audienceFit' | 'competition' | 'marketDemand' | 'feasibility' | 'pricingPotential';

export interface PillarResult {
  pillar: PillarName;
  score: number; // 0-100
  strength?: string;
  weakness?: string;
  rationale?: string;
}

export type ProductOverview = AIProductOverview;

export interface IdeaImprovementResult {
  improvedOverview: ProductOverview;
  differences: Array<{ section: string; before: string; after: string }>;
  pillarImpacted: PillarName;
  expectedScoreIncrease: number;
  updatedPillars: PillarResult[];
}

export interface AutoImproveResult {
  finalOverview: ProductOverview;
  pillars: PillarResult[];
  iterations: IdeaImprovementResult[];
  reachedTarget: boolean;
}

const improvementSchema = z.object({
  improvedOverview: z.record(z.any()),
  differences: z
    .array(
      z.object({
        section: z.string(),
        before: z.string(),
        after: z.string(),
      }),
    )
    .default([]),
  pillarImpacted: z.string(),
  expectedScoreIncrease: z.number().min(0).max(100).default(5),
});

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function detectWeakestPillar(pillars: PillarResult[]): PillarResult | null {
  if (!pillars?.length) return null;
  return pillars.reduce((weakest, current) =>
    current.score < (weakest?.score ?? Number.POSITIVE_INFINITY) ? current : weakest,
  );
}

function normalizeOverview(base: ProductOverview, incoming: unknown): ProductOverview {
  if (!incoming || typeof incoming !== 'object') return base;
  const merged = { ...base, ...(incoming as Record<string, unknown>) } as ProductOverview;
  return merged;
}

function buildImprovementPrompt(params: {
  overview: ProductOverview;
  pillars: PillarResult[];
  targetPillar: PillarName;
}) {
  const { overview, pillars, targetPillar } = params;
  const pillarBlock = pillars
    .map(
      (pillar) =>
        `${pillar.pillar} (score ${pillar.score}/100)
Strength: ${pillar.strength || 'n/a'}
Weakness: ${pillar.weakness || pillar.rationale || 'n/a'}
`,
    )
    .join('\n');

  const systemPrompt = `You are an AI refinement engine that rewrites a Product Overview and reports concise diffs.
You MUST keep structure and context, only improve clarity, strategy, and differentiation.
Prefer targeted edits over rewrites. Keep personas, features, and monetisation aligned with the idea.
Only change what helps the target pillar.`;

  const userPrompt = `Here is the current Product Overview (JSON):
${JSON.stringify(overview, null, 2)}

Pillar diagnostics:
${pillarBlock}

Pillar to improve: ${targetPillar}

Respond with ONLY JSON:
{
  "improvedOverview": { ...updated overview... },
  "differences": [
    { "section": "Competition", "before": "...", "after": "..." }
  ],
  "pillarImpacted": "${targetPillar}",
  "expectedScoreIncrease": 5
}`;

  return { systemPrompt, userPrompt };
}

function applyScoreIncrease(pillars: PillarResult[], pillarImpacted: PillarName, delta: number): PillarResult[] {
  return pillars.map((pillar) =>
    pillar.pillar === pillarImpacted
      ? { ...pillar, score: clampScore(pillar.score + delta) }
      : pillar,
  );
}

export async function improveIdea(
  idea: ProductOverview,
  pillars: PillarResult[],
  targetPillar: PillarName,
): Promise<IdeaImprovementResult> {
  const fallbackPillar = detectWeakestPillar(pillars)?.pillar || targetPillar;
  const prompts = buildImprovementPrompt({
    overview: idea,
    pillars,
    targetPillar: targetPillar || fallbackPillar,
  });

  const { data } = await callJsonPrompt<unknown>({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    temperature: 0.4,
    timeoutMs: 60000,
  });

  const parsed = improvementSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('AI refinement response failed validation');
  }

  const { improvedOverview, differences, pillarImpacted, expectedScoreIncrease } = parsed.data;
  const normalizedOverview = normalizeOverview(idea, improvedOverview);
  const impactedPillar = (pillarImpacted as PillarName) || fallbackPillar;
  const delta = Number.isFinite(expectedScoreIncrease) ? expectedScoreIncrease : 5;
  const updatedPillars = applyScoreIncrease(pillars, impactedPillar, delta);

  return {
    improvedOverview: normalizedOverview,
    differences,
    pillarImpacted: impactedPillar,
    expectedScoreIncrease: delta,
    updatedPillars,
  };
}

export async function autoImproveIdea(
  idea: ProductOverview,
  pillars: PillarResult[],
  targetScore: number = 90,
): Promise<AutoImproveResult> {
  let currentOverview = idea;
  let currentPillars = pillars;
  const iterations: IdeaImprovementResult[] = [];
  const maxLoops = 4;

  for (let i = 0; i < maxLoops; i++) {
    const weakest = detectWeakestPillar(currentPillars);
    if (!weakest) break;
    if (weakest.score >= targetScore) break;

    const result = await improveIdea(currentOverview, currentPillars, weakest.pillar);
    iterations.push(result);
    currentOverview = result.improvedOverview;
    currentPillars = result.updatedPillars;
  }

  const weakestAfter = detectWeakestPillar(currentPillars);
  const reachedTarget = (weakestAfter?.score ?? 0) >= targetScore;

  return {
    finalOverview: currentOverview,
    pillars: currentPillars,
    iterations,
    reachedTarget,
  };
}

