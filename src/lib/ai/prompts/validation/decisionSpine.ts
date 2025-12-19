import { z } from 'zod';
import { DecisionAssumption, DecisionSpine } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface DecisionSpinePromptInput {
  title: string;
  summary?: string;
  recommendation: 'build' | 'revise' | 'drop';
  overallConfidence: number;
  rationaleSummary?: string;
  riskSummary?: string;
  opportunitySummary?: string;
  ideaEnhancement?: string;
}

const DecisionAssumptionSchema = z.object({
  statement: z.string().min(5),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

const DecisionSpineSchema = z.object({
  verdictLabel: z.string().min(6).max(140),
  confidence: z.number().int().min(0).max(100),
  killRisks: z.array(z.string().min(6)).min(2).max(5),
  winMoves: z.array(z.string().min(6)).min(2).max(5),
  assumptions: z.array(DecisionAssumptionSchema).min(3).max(6),
});

const DecisionSpineResponseSchema = z.object({
  spine: DecisionSpineSchema,
});

export async function generateDecisionSpine(input: DecisionSpinePromptInput): Promise<DecisionSpine> {
  const systemPrompt = `You are an AI product strategist. Using validation data, craft a concise decision spine:
- Verdict label (short sentence)
- Confidence (0-100)
- Kill risks (worst-case blockers)
- Win moves (what to push on)
- Assumptions tagged with risk levels

Always output valid JSON.`;

  const userPrompt = `Summarise this idea's diligence run into a decision spine.

Idea Title: ${input.title}
Recommendation: ${input.recommendation}
Overall Confidence: ${input.overallConfidence}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.rationaleSummary ? `Validation Rationale:\n${input.rationaleSummary}\n` : ''}
${input.riskSummary ? `Risk/Radar Notes:\n${input.riskSummary}\n` : ''}
${input.opportunitySummary ? `Opportunity Signals:\n${input.opportunitySummary}\n` : ''}
${input.ideaEnhancement ? `Strategy/Enhancement Notes:\n${input.ideaEnhancement}\n` : ''}

Return JSON:
{
  "spine": {
    "verdictLabel": "...",
    "confidence": 0-100,
    "killRisks": ["..."],
    "winMoves": ["..."],
    "assumptions": [
      { "statement": "...", "riskLevel": "low|medium|high" }
    ]
  }
}`;

  const result = await runStructuredPrompt(DecisionSpineResponseSchema, systemPrompt, userPrompt);
  return result.spine as DecisionSpine & { assumptions: DecisionAssumption[] };
}
