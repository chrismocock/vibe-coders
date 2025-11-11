import { ValidationAgent, AgentResult } from '../types';

export const pricingPotentialAgent: ValidationAgent = {
  id: 'pricing-potential',
  label: 'Pricing Potential',
  weight: 1,
  async run(input): Promise<AgentResult> {
    // TODO: call OpenAI with JSON response_format enforcing 0-100 score
    return { key: 'pricingPotential', score: 50, rationale: 'Stubbed result' };
  },
};

