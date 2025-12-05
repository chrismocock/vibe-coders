import {
  VALIDATION_PILLAR_DEFINITIONS,
  ValidationPillarsPromptInput,
  ValidationPillarsResponseSchema,
} from '@/lib/ai/prompts/validation/pillars';
import { callJsonPrompt } from './openai';
import { ValidationPillarId, ValidationPillarResult } from './types';

export type PillarServiceInput = ValidationPillarsPromptInput;

const PILLAR_ANALYSIS_SYSTEM_PROMPT = `You are validating and refining a startup idea chosen by the user during the Ideate stage.

Your task now is to analyse this idea across seven validation pillars and return structured, actionable feedback for each pillar.

Be concrete, practical, specific, and realistic.
Do NOT be vague or generic.

Your output must help the user understand:
- who their audience is
- what problem they solve
- how strong their solution is
- how they compare to competitors
- how big demand might be
- feasibility using AI-first "vibe coding" tools
- monetisation & revenue potential

PILLAR 1: Audience Fit
Provide:
- Clear target audience segments
- 2–3 short personas: roles, motivations, frustrations, triggers
- What these users want from this product
- Why they would adopt it

PILLAR 2: Problem Clarity
Provide:
- The core problem being solved
- Who feels the problem most
- How painful/urgent the problem is
- What happens if the problem is not solved
- Evidence the problem is real and meaningful

PILLAR 3: Solution Strength
Provide:
- How well the solution addresses the problem
- Strengths
- Weaknesses or blind spots
- Improvements that would increase the value
- Opportunities the user hasn’t considered

PILLAR 4: Competition
Provide:
- Direct competitors
- Indirect/alternative solutions
- What competitors do well
- What they do poorly
- Gaps the user can exploit
- A simple competitor positioning summary

PILLAR 5: Market Size & Demand Signals
Provide:
- Estimated market size (relative scale if exact numbers unknown)
- Search trends or keywords to explore
- Relevant Reddit communities or audience clusters
- Whether demand is growing or declining
- How many people might want this solution
Do NOT fabricate specific statistical data. Use directional estimates and reasoning.

PILLAR 6: Feasibility & Build Complexity (Vibe Coding Tools)
Provide:
- How easy/difficult this is to build using AI-first tools (vibe coding)
- What parts are simple, moderate, complex
- Realistic MVP scope
- Potential blockers
- Recommended build approach

PILLAR 7: Monetisation Potential
Provide:
- Best monetisation models
- Early revenue potential (qualitative)
- Long-term revenue potential (qualitative)
- Expected margins (directional, not precise)
- How profitable this idea could be in optimistic + conservative cases
Be optimistic but grounded.

SCORING
For each pillar, provide:
- score (1–10)
- strength (one sentence)
- weakness (one sentence)
- improvementSuggestion (one actionable suggestion)

OUTPUT FORMAT
Return ONLY valid JSON:
{
  "pillars": [
    {
      "pillarId": "audienceFit",
      "pillarName": "Audience Fit",
      "score": 1-10,
      "strength": "",
      "weakness": "",
      "analysis": "",
      "improvementSuggestion": ""
    }
  ]
}

If unsure, reason briefly but output must always be valid JSON.`;

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
  return pillarIdAliases[compact];
}

function buildPillarAnalysisPrompts(input: PillarServiceInput) {
  const title = input.title?.trim() || 'Untitled Idea';
  const summary = input.summary?.trim() || 'No summary provided.';
  const context = input.context?.trim();
  const contextBlock = context ? `\nAdditional Context:\n${context}\n` : '\n';

  const userPrompt = `Idea Title: ${title}
Idea Summary:
${summary}${contextBlock}`;

  return {
    systemPrompt: PILLAR_ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
  };
}

export async function generatePillars(input: PillarServiceInput): Promise<ValidationPillarResult[]> {
  if (!input.summary?.trim() && !input.title?.trim()) {
    throw new Error('Idea title or summary is required to generate pillar diagnostics');
  }

  const prompts = buildPillarAnalysisPrompts(input);

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
      analysis: pillar?.analysis ?? `No analysis provided for ${definition.name}.`,
      strength: pillar?.strength ?? `Need stronger signals for ${definition.name}.`,
      weakness: pillar?.weakness ?? `No weaknesses captured for ${definition.name}.`,
      improvementSuggestion:
        pillar?.improvementSuggestion ?? `Add explicit mitigation ideas for ${definition.name.toLowerCase()}.`,
    };
  });
}

export const generateValidationPillars = generatePillars;


