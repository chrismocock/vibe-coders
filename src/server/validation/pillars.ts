import {
  VALIDATION_PILLAR_DEFINITIONS,
  ValidationPillarsPromptInput,
  ValidationPillarsResponseSchema,
  buildValidationPillarsPrompts,
} from '@/lib/ai/prompts/validation/pillars';
import { callJsonPrompt } from './openai';
import { ValidationPillarId, ValidationPillarResult } from './types';

export interface PillarServiceInput extends ValidationPillarsPromptInput {}

const clampScoreToTen = (value: number) => Math.max(0, Math.min(10, Math.round(value ?? 0)));

const pillarIdAliases: Record<string, ValidationPillarId> = {
  audiencefit: 'audienceFit',
  audience_fit: 'audienceFit',
  targetaudience: 'audienceFit',
  problemclarity: 'problemClarity',
  problem_clarity: 'problemClarity',
  problemdefinition: 'problemClarity',
  solutionstrength: 'solutionStrength',
  solution_strength: 'solutionStrength',
  solutionscore: 'solutionStrength',
  competition: 'competition',
  competitive: 'competition',
  marketsize: 'marketSize',
  tam: 'marketSize',
  tam_sam: 'marketSize',
  feasibility: 'feasibility',
  feasibilitybuild: 'feasibility',
  monetisation: 'monetisation',
  monetization: 'monetisation',
  monetizationpotential: 'monetisation',
};

function normalizePillarId(id?: string | null): ValidationPillarId | undefined {
  if (!id) return undefined;
  const compact = id.toLowerCase().replace(/[^a-z]/g, '');
  if (pillarIdAliases[compact]) {
    return pillarIdAliases[compact];
  }
  if ((['audiencefit','problemclarity','solutionstrength','competition','marketsize','feasibility','monetisation'] as const).includes(compact as any)) {
    return compact as ValidationPillarId;
  }
  return undefined;
}

export async function generateValidationPillars(input: PillarServiceInput): Promise<ValidationPillarResult[]> {
  if (!input.summary?.trim() && !input.title?.trim()) {
    throw new Error('Idea title or summary is required to generate pillar diagnostics');
  }

  const prompts = buildValidationPillarsPrompts({
    title: input.title || 'Untitled Idea',
    summary: input.summary || 'No summary provided.',
    context: input.context,
  });

  const { data } = await callJsonPrompt({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    temperature: 0.4,
    timeoutMs: 45000,
  });

  const parsed = ValidationPillarsResponseSchema.parse(data);
  const pillarMap = new Map(
    parsed.pillars
      .map((pillar) => {
        const normalizedId = normalizePillarId(pillar.pillarId);
        return normalizedId ? [normalizedId, pillar] : null;
      })
      .filter((entry): entry is [ValidationPillarId, typeof parsed.pillars[number]] => !!entry),
  );

  return VALIDATION_PILLAR_DEFINITIONS.map((definition) => {
    const pillar = pillarMap.get(definition.id);
    return {
      pillarId: definition.id,
      pillarName: definition.name,
      score: clampScoreToTen(pillar?.score ?? 5),
      strength: pillar?.strength ?? `Need stronger signals for ${definition.name}.`,
      weakness: pillar?.weakness ?? `No weaknesses captured for ${definition.name}.`,
      improvementSuggestion:
        pillar?.improvementSuggestion ?? `Add explicit mitigation ideas for ${definition.name.toLowerCase()}.`,
    };
  });
}


