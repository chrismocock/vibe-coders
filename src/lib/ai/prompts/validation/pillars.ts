import { z } from 'zod';
import { ValidationPillarId } from '@/server/validation/types';

export interface ValidationPillarDefinition {
  id: ValidationPillarId;
  name: string;
  description: string;
}

export const VALIDATION_PILLAR_DEFINITIONS: ValidationPillarDefinition[] = [
  {
    id: 'audienceFit',
    name: 'Audience Fit',
    description: 'Clarity of ICP, pain intensity, and willingness to pay.',
  },
  {
    id: 'problemClarity',
    name: 'Problem Clarity',
    description: 'How crisply the core problem and triggers are defined.',
  },
  {
    id: 'solutionStrength',
    name: 'Solution Strength',
    description: 'Solution completeness, UX clarity, and value delivery.',
  },
  {
    id: 'competition',
    name: 'Competition',
    description: 'Differentiation, market saturation, and switching costs.',
  },
  {
    id: 'marketSize',
    name: 'Market Size (TAM/SAM)',
    description: 'Evidence of a meaningful, reachable market.',
  },
  {
    id: 'feasibility',
    name: 'Feasibility & Build Complexity',
    description: 'Technical lift, dependencies, and time-to-build.',
  },
  {
    id: 'monetisation',
    name: 'Monetisation Potential',
    description: 'Revenue model clarity, pricing leverage, and payback.',
  },
];

export const ValidationPillarSchema = z.object({
  pillarId: z.string().min(3),
  pillarName: z.string().min(3).max(60),
  score: z.number().min(0).max(10),
  strength: z.string().min(10).max(240),
  weakness: z.string().min(10).max(240),
  improvementSuggestion: z.string().min(10).max(240),
});

export const ValidationPillarsResponseSchema = z.object({
  pillars: z.array(ValidationPillarSchema).min(7).max(7),
});

export interface ValidationPillarsPromptInput {
  title: string;
  summary?: string;
  context?: string;
}

export function buildValidationPillarsPrompts(input: ValidationPillarsPromptInput) {
  const systemPrompt = `You are an AI validation partner. Score a startup idea across 7 pillars.

Rules:
- Output ONLY valid JSON that matches the requested schema.
- Each score must be an integer from 0-10.
- Keep sentences concise (<=160 chars) and actionable.
- Never invent extra pillars or commentary.`;

  const pillarDetails = VALIDATION_PILLAR_DEFINITIONS.map(
    (pillar) => `- ${pillar.name}: ${pillar.description}`
  ).join('\n');

  const userPrompt = `Evaluate this idea and score each pillar from 0-10.

Idea Title: ${input.title}
Idea Summary:
${input.summary ?? 'Not provided.'}

${input.context ? `Additional Context:\n${input.context}\n` : ''}
Seven Pillars:
${pillarDetails}

Return JSON:
{
  "pillars": [
    {
      "pillarId": "audienceFit",
      "pillarName": "Audience Fit",
      "score": 7,
      "strength": "Concise strength sentence.",
      "weakness": "Concise weakness sentence.",
      "improvementSuggestion": "Actionable improvement."
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}


