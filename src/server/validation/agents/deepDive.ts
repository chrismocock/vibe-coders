import { DeepDivePromptInput, generateDeepDiveInsights } from '@/lib/ai/prompts/validation/deepDive';
import { SectionDeepDive } from '../types';

export async function runDeepDiveAgent(input: DeepDivePromptInput): Promise<SectionDeepDive> {
  return generateDeepDiveInsights(input);
}

