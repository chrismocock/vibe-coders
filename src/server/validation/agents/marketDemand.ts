import { ValidationAgent, AgentResult } from '../types';

export const marketDemandAgent: ValidationAgent = {
  id: 'market-demand',
  label: 'Market Demand',
  weight: 1,
  async run(input): Promise<AgentResult> {
    // TODO: call OpenAI with JSON response_format enforcing 0-100 score
    return { key: 'marketDemand', score: 50, rationale: 'Stubbed result' };
  },
};

