import { ValidationAgent, AgentResult } from '../types';

export const competitionAgent: ValidationAgent = {
  id: 'competition',
  label: 'Competition',
  weight: 1,
  async run(input): Promise<AgentResult> {
    // TODO: call OpenAI with JSON response_format enforcing 0-100 score
    return { key: 'competition', score: 50, rationale: 'Stubbed result' };
  },
};

