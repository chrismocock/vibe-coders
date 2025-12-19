import {
  DecisionSpinePromptInput,
  generateDecisionSpine,
} from '@/lib/ai/prompts/validation/decisionSpine';
import { DecisionSpine } from '../types';

export async function runDecisionSpineAgent(input: DecisionSpinePromptInput): Promise<DecisionSpine> {
  return generateDecisionSpine(input);
}
