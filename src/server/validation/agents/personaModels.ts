import { PersonasPromptInput, generatePersonas } from '@/lib/ai/prompts/validation/personas';
import { Persona } from '../types';

export async function runPersonaModelsAgent(input: PersonasPromptInput): Promise<Persona[]> {
  return generatePersonas(input);
}

