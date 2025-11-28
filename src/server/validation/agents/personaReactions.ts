import {
  PersonaReactionsPromptInput,
  generatePersonaReactions,
} from '@/lib/ai/prompts/validation/sectionPersonaReactions';
import { PersonaReaction } from '../types';

export async function runPersonaReactionsAgent(
  input: PersonaReactionsPromptInput
): Promise<PersonaReaction[]> {
  return generatePersonaReactions(input);
}

