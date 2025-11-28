import { z } from 'zod';
import { OpportunityScore } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface OpportunityScorePromptInput {
  title: string;
  summary?: string;
  marketSignals?: string;
  audienceSignals?: string;
  feasibilitySignals?: string;
}

const OpportunityScoreSchema = z.object({
  score: z.number().min(0).max(100),
  breakdown: z.object({
    marketMomentum: z.number().min(0).max(100),
    audienceEnthusiasm: z.number().min(0).max(100),
    feasibility: z.number().min(0).max(100),
  }),
  rationale: z.string().min(30).max(400),
});

export async function generateOpportunityScore(input: OpportunityScorePromptInput): Promise<OpportunityScore> {
  const systemPrompt = `You are a venture analyst summarising commercial opportunity. You blend market, audience, and feasibility signals into a single score for decision-makers.

Return ONLY valid JSON. No markdown.`;

  const userPrompt = `Calculate an opportunity score for this idea (0-100) where 100 is extremely attractive.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.marketSignals ? `Market Signals:\n${input.marketSignals}\n` : ''}
${input.audienceSignals ? `Audience Signals:\n${input.audienceSignals}\n` : ''}
${input.feasibilitySignals ? `Feasibility Signals:\n${input.feasibilitySignals}\n` : ''}

Provide JSON:
{
  "score": 86,
  "breakdown": {
    "marketMomentum": 88,
    "audienceEnthusiasm": 82,
    "feasibility": 78
  },
  "rationale": "Concise reasoning <= 400 chars."
}

Rules:
- Each breakdown score must be 0-100.
- Keep rationale specific and insight-driven.`;

  return runStructuredPrompt(OpportunityScoreSchema, systemPrompt, userPrompt);
}


