import { DesignBriefPromptInput, generateDesignBrief } from '@/lib/ai/prompts/validation/designBrief';
import { DesignBrief } from '../types';

export async function runDesignBriefAgent(input: DesignBriefPromptInput): Promise<DesignBrief> {
  return generateDesignBrief(input);
}

