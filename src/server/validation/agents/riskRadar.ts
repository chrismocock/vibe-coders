import { RiskRadarPromptInput, generateRiskRadar } from '@/lib/ai/prompts/validation/riskRadar';
import { RiskRadar } from '../types';

export async function runRiskRadarAgent(input: RiskRadarPromptInput): Promise<RiskRadar> {
  return generateRiskRadar(input);
}

