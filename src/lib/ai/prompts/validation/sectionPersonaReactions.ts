import { z } from 'zod';
import { PersonaReaction, ValidationSection } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface PersonaReactionsPromptInput {
  section: ValidationSection;
  title: string;
  summary?: string;
  sectionInsights?: string;
  personas?: string;
}

const PersonaReactionSchema = z.object({
  personaName: z.string().min(2),
  reaction: z.string().min(10).max(280),
  likes: z.array(z.string().min(3)).min(1).max(5),
  dislikes: z.array(z.string().min(3)).min(0).max(4),
  confusionPoints: z.array(z.string().min(3)).min(0).max(4),
  requestedFeatures: z.array(z.string().min(3)).min(0).max(4),
});

const PersonaReactionsResponseSchema = z.object({
  reactions: z.array(PersonaReactionSchema).min(2).max(4),
});

function formatSection(section: ValidationSection): string {
  switch (section) {
    case 'problem':
      return 'Problem';
    case 'market':
      return 'Market';
    case 'competition':
      return 'Competition';
    case 'audience':
      return 'Audience';
    case 'feasibility':
      return 'Feasibility';
    case 'pricing':
      return 'Pricing';
    case 'go-to-market':
      return 'Go-To-Market';
    case 'overview':
      return 'Overview';
    default:
      return section;
  }
}

export async function generatePersonaReactions(input: PersonaReactionsPromptInput): Promise<PersonaReaction[]> {
  const sectionLabel = formatSection(input.section);
  const systemPrompt = `You are the voice of the personas for this product. For each persona, summarise their reaction to the latest ${sectionLabel} insights so designers and strategists can act quickly.

Return ONLY valid JSON. No markdown. Keep each bullet direct and actionable.`;

  const userPrompt = `Summarise how each persona reacts to the ${sectionLabel} findings.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.personas ? `Personas:\n${input.personas}\n` : ''}
${input.sectionInsights ? `${sectionLabel} Insights:\n${input.sectionInsights}\n` : ''}

Provide JSON:
{
  "reactions": [
    {
      "personaName": "...",
      "reaction": "...",
      "likes": ["..."],
      "dislikes": ["..."],
      "confusionPoints": ["..."],
      "requestedFeatures": ["..."]
    }
  ]
}

Rules:
- Highlight evidence-based reactions tied to the data provided.
- Use concise, plain language.
- If a list would be empty, return an empty array.`;

  const result = await runStructuredPrompt(PersonaReactionsResponseSchema, systemPrompt, userPrompt);
  return result.reactions;
}


