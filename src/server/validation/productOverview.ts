import {
  AIProductOverviewSchema,
  ProductOverviewPromptInput,
  buildProductOverviewPrompts,
} from '@/lib/ai/prompts/validation/productOverview';
import { callJsonPrompt } from './openai';
import { AIProductOverview } from './types';

export interface ProductOverviewServiceInput extends ProductOverviewPromptInput {}

export async function generateProductOverview(
  input: ProductOverviewServiceInput,
): Promise<AIProductOverview> {
  if (!input.summary?.trim()) {
    throw new Error('Idea summary is required to generate the AI Product Overview');
  }

  const prompts = buildProductOverviewPrompts(input);

  const { data } = await callJsonPrompt({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    temperature: 0.55,
    timeoutMs: 60000,
  });

  const parsed = AIProductOverviewSchema.parse(data);
  return parsed.overview;
}


