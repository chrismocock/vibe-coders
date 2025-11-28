import {
  IdeaEnhancerPromptInput,
  generateIdeaEnhancement,
} from '@/lib/ai/prompts/validation/ideaEnhancer';
import { IdeaEnhancement } from '../types';

export async function runIdeaEnhancerAgent(input: IdeaEnhancerPromptInput): Promise<IdeaEnhancement> {
  return generateIdeaEnhancement(input);
}

