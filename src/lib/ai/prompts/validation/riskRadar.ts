import { z } from 'zod';
import { RiskRadar } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface RiskRadarPromptInput {
  title: string;
  summary?: string;
  marketSignals?: string;
  competitionSignals?: string;
  technicalSignals?: string;
  monetisationSignals?: string;
  gtmSignals?: string;
}

const RiskRadarSchema = z.object({
  market: z.number().min(0).max(100),
  competition: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  monetisation: z.number().min(0).max(100),
  goToMarket: z.number().min(0).max(100),
  commentary: z.array(z.string().min(3)).min(1).max(8).optional(),
});

export async function generateRiskRadar(input: RiskRadarPromptInput): Promise<RiskRadar> {
  const systemPrompt = `You are a product risk analyst. Score each risk dimension from 0 (no risk) to 100 (critical risk) and provide short commentary.

Return ONLY valid JSON in the requested schema.`;

  const userPrompt = `Score the risk profile for this idea (0=negligible risk, 100=severe risk requiring mitigation).

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.marketSignals ? `Market Risk Signals:\n${input.marketSignals}\n` : ''}
${input.competitionSignals ? `Competition Risk Signals:\n${input.competitionSignals}\n` : ''}
${input.technicalSignals ? `Technical Risk Signals:\n${input.technicalSignals}\n` : ''}
${input.monetisationSignals ? `Monetisation Risk Signals:\n${input.monetisationSignals}\n` : ''}
${input.gtmSignals ? `Go-To-Market Risk Signals:\n${input.gtmSignals}\n` : ''}

Provide JSON:
{
  "market": 45,
  "competition": 62,
  "technical": 30,
  "monetisation": 55,
  "goToMarket": 48,
  "commentary": ["Insightful note", "..."]
}

Notes:
- Higher number = higher risk.
- Supply 1-6 brief commentary notes highlighting biggest watch-outs.`;

  return runStructuredPrompt(RiskRadarSchema, systemPrompt, userPrompt);
}


