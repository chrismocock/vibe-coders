import { ValidationAgent, AgentResult } from '../types';

export const audienceFitAgent: ValidationAgent = {
  id: 'audience-fit',
  label: 'Audience Fit',
  weight: 1,
  async run(input): Promise<AgentResult> {
    // TODO: call OpenAI with JSON response_format enforcing 0-100 score
    return { key: 'audienceFit', score: 50, rationale: 'Stubbed result' };
  },
};

