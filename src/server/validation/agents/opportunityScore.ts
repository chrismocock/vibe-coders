import {
  OpportunityScorePromptInput,
  generateOpportunityScore,
} from '@/lib/ai/prompts/validation/opportunityScore';
import { OpportunityScore } from '../types';

export async function runOpportunityScoreAgent(
  input: OpportunityScorePromptInput
): Promise<OpportunityScore> {
  return generateOpportunityScore(input);
}

