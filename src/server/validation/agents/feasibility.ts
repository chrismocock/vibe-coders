import { ValidationAgent, AgentResult } from '../types';

export const feasibilityAgent: ValidationAgent = {
  id: 'feasibility',
  label: 'Feasibility',
  weight: 1,
  async run(input): Promise<AgentResult> {
    // TODO: call OpenAI with JSON response_format enforcing 0-100 score
    return { key: 'feasibility', score: 50, rationale: 'Stubbed result' };
  },
};

