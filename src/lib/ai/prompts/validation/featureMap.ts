import { z } from 'zod';
import { FeatureMap } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface FeatureMapPromptInput {
  title: string;
  summary?: string;
  personas?: string;
  insights?: string;
  aiReview?: string;
}

const FeatureMapSchema = z.object({
  must: z.array(z.string().min(3)).min(3).max(8),
  should: z.array(z.string().min(3)).min(2).max(8),
  could: z.array(z.string().min(3)).min(1).max(6),
  avoid: z.array(z.string().min(3)).min(1).max(6),
});

const FeatureMapResponseSchema = z.object({
  features: FeatureMapSchema,
});

export async function generateFeatureOpportunityMap(input: FeatureMapPromptInput): Promise<FeatureMap> {
  const systemPrompt = `You are an award-winning product strategist. You translate research into a clear feature priority map designed for cross-functional teams.

Return ONLY valid JSON in the requested schema. No commentary.`;

  const userPrompt = `Create a must/should/could/avoid feature map for this idea.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.personas ? `Personas Insights:\n${input.personas}\n` : ''}
${input.insights ? `Validation Signals:\n${input.insights}\n` : ''}
${input.aiReview ? `Previous AI Review:\n${input.aiReview}\n` : ''}

Rules:
- "must" are critical launch features solving the primary job-to-be-done (3-8 items)
- "should" are important enhancers improving adoption/retention (2-8 items)
- "could" are delightful extras when time permits (1-6 items)
- "avoid" are risky, distracting, or low-value features to skip (1-6 items)

Output JSON:
{
  "features": {
    "must": ["..."],
    "should": ["..."],
    "could": ["..."],
    "avoid": ["..."]
  }
}`;

  const result = await runStructuredPrompt(FeatureMapResponseSchema, systemPrompt, userPrompt);
  return result.features;
}


