import { z } from 'zod';
import { Persona } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface PersonasPromptInput {
  title: string;
  summary?: string;
  aiReview?: string;
  context?: Record<string, unknown>;
}

const PersonaSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(15).max(100).optional(),
  role: z.string().min(2).max(80).optional(),
  description: z.string().min(10).max(280).optional(),
  goals: z.array(z.string().min(3)).min(1),
  pains: z.array(z.string().min(3)).min(1),
  triggers: z.array(z.string().min(3)).min(1),
  objections: z.array(z.string().min(3)).min(1),
  solutionFit: z.array(z.string().min(3)).min(1),
  neededFeatures: z.array(z.string().min(3)).min(1),
});

const PersonasResponseSchema = z.object({
  personas: z.array(PersonaSchema).min(2).max(4),
});

export async function generatePersonas(input: PersonasPromptInput): Promise<Persona[]> {
  const systemPrompt = `You are an elite product strategist and customer researcher. You turn messy startup ideas into precise persona models that product teams can design from.

Return ONLY valid JSON matching the provided schema. Never add commentary or markdown.`;

  const userPrompt = `Create between 2 and 4 vivid personas for this idea.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.aiReview ? `Supporting Analysis:\n${input.aiReview}\n` : ''}

For each persona include:
- name (human readable)
- approximate age
- optional role/job title if relevant
- concise description of who they are
- goals (top business or personal outcomes)
- pains (core frustrations, blockers)
- triggers (what event makes them seek this solution)
- objections (what would make them hesitate)
- solutionFit (why this idea solves their pain)
- neededFeatures (features they expect or request)

Respond with JSON:
{
  "personas": [
    {
      "name": "...",
      "age": 32,
      "role": "...",
      "description": "...",
      "goals": ["..."],
      "pains": ["..."],
      "triggers": ["..."],
      "objections": ["..."],
      "solutionFit": ["..."],
      "neededFeatures": ["..."]
    }
  ]
}`;

  const result = await runStructuredPrompt(PersonasResponseSchema, systemPrompt, userPrompt);

  return result.personas.map((persona) => ({
    name: persona.name,
    age: persona.age,
    role: persona.role,
    description: persona.description,
    goals: persona.goals,
    pains: persona.pains,
    triggers: persona.triggers,
    objections: persona.objections,
    solutionFit: persona.solutionFit,
    neededFeatures: persona.neededFeatures,
  }));
}


