import { z } from 'zod';
import { IdeaEnhancement } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface IdeaEnhancerPromptInput {
  title: string;
  summary?: string;
  aiReview?: string;
  personas?: string;
  featureMap?: string;
  competitorNotes?: string;
}

const IdeaEnhancementSchema = z.object({
  strongerPositioning: z.string().min(20).max(400),
  uniqueAngle: z.string().min(20).max(400),
  differentiators: z.array(z.string().min(3)).min(3).max(8),
  featureAdditions: z.array(z.string().min(3)).min(2).max(8),
  betterTargetAudiences: z.array(z.string().min(3)).min(1).max(6),
  pricingStrategy: z.string().min(20).max(400),
  whyItWins: z.string().min(30).max(500),
});

const IdeaEnhancerResponseSchema = z.object({
  enhancement: IdeaEnhancementSchema,
});

export async function generateIdeaEnhancement(input: IdeaEnhancerPromptInput): Promise<IdeaEnhancement> {
  const systemPrompt = `You are an AI co-founder specialising in positioning and go-to-market strategy. You upgrade product ideas so they win their market.

Return ONLY valid JSON matching the schema. Do not add commentary.`;

  const userPrompt = `Strengthen this idea with sharper positioning, differentiators, feature upgrades, refined targeting, and pricing strategy.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.aiReview ? `Validation Signals:\n${input.aiReview}\n` : ''}
${input.personas ? `Persona Insights:\n${input.personas}\n` : ''}
${input.featureMap ? `Feature Map:\n${input.featureMap}\n` : ''}
${input.competitorNotes ? `Competitor Context:\n${input.competitorNotes}\n` : ''}

Provide JSON:
{
  "enhancement": {
    "strongerPositioning": "...",
    "uniqueAngle": "...",
    "differentiators": ["..."],
    "featureAdditions": ["..."],
    "betterTargetAudiences": ["..."],
    "pricingStrategy": "...",
    "whyItWins": "..."
  }
}`;

  const result = await runStructuredPrompt(IdeaEnhancerResponseSchema, systemPrompt, userPrompt);
  return result.enhancement;
}


