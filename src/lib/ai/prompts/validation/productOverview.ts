import { z } from 'zod';
import { ValidationPillarResult } from '@/server/validation/types';

export const AIProductPersonaSchema = z.object({
  name: z.string().min(2).max(60),
  summary: z.string().min(20).max(220),
  needs: z.array(z.string().min(4)).min(2).max(5),
  motivations: z.array(z.string().min(4)).min(1).max(4).optional(),
});

export const AIProductRiskSchema = z.object({
  risk: z.string().min(10).max(200),
  mitigation: z.string().min(10).max(220),
});

export const AIProductMonetisationSchema = z.object({
  model: z.string().min(3).max(80),
  description: z.string().min(15).max(240),
  pricingNotes: z.string().min(8).max(200).optional(),
});

export const AIProductOverviewSchema = z.object({
  overview: z.object({
    refinedPitch: z.string().min(20).max(320),
    problemSummary: z.string().min(30).max(320),
    personas: z.array(AIProductPersonaSchema).min(1).max(4),
    solution: z.string().min(40).max(400),
    coreFeatures: z.array(z.string().min(4).max(140)).min(1).max(10),
    uniqueValue: z.string().min(25).max(320),
    competition: z.string().min(25).max(320),
    risks: z.array(AIProductRiskSchema).min(1).max(5),
    monetisation: z.array(AIProductMonetisationSchema).min(1).max(4),
    buildNotes: z.string().min(25).max(360),
  }),
});

export interface ProductOverviewPromptInput {
  title: string;
  summary: string;
  context?: string;
  pillars: ValidationPillarResult[];
}

export function buildProductOverviewPrompts(input: ProductOverviewPromptInput) {
  const systemPrompt = `You are an AI product strategist who rewrites founders' ideas into a crisp, investor-ready overview.

Return ONLY valid JSON matching the requested schema. Keep copy punchy and design-ready.`;

  const pillarInsights = input.pillars
    .map(
      (pillar) =>
        `${pillar.pillarName} (${pillar.score}/10)
Strength: ${pillar.strength}
Weakness: ${pillar.weakness}
Improve: ${pillar.improvementSuggestion}`
    )
    .join('\n\n');

  const userPrompt = `Clean up and improve this idea so the design team can move immediately.

Idea Title: ${input.title}
Idea Summary:
${input.summary}
${input.context ? `\nAdditional Context:\n${input.context}\n` : '\n'}

Validation Pillar Diagnostics:
${pillarInsights}

Output JSON:
{
  "overview": {
    "refinedPitch": "2 sentences max.",
    "problemSummary": "...",
    "personas": [
      {
        "name": "...",
        "summary": "...",
        "needs": ["...", "..."],
        "motivations": ["...", "..."]
      }
    ],
    "solution": "...",
    "coreFeatures": ["Feature 1", "Feature 2"],
    "uniqueValue": "...",
    "competition": "...",
    "risks": [
      { "risk": "...", "mitigation": "..." }
    ],
    "monetisation": [
      { "model": "Subscription", "description": "...", "pricingNotes": "..." }
    ],
    "buildNotes": "..."
  }
}`;

  return { systemPrompt, userPrompt };
}


