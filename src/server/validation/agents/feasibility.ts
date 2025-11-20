import { ValidationAgent } from '../types';
import { callValidationAgent } from '../openai';

export const feasibilityAgent: ValidationAgent = {
  id: 'feasibility',
  label: 'Feasibility',
  weight: 1,
  async run(input): Promise<import('../types').AgentResult> {
    const systemPrompt = `You are a technical feasibility analyst evaluating startup ideas. Analyze how feasible ideas are to build and provide structured assessments.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Low complexity, minimal dependencies, fast to build, minimal regulatory issues
- 60-79: Moderate complexity, manageable dependencies, reasonable timeline
- 40-59: High complexity, significant dependencies, longer timeline
- 0-39: Very high complexity, major blockers, regulatory issues, unrealistic to build`;

    const userPrompt = `Evaluate how feasible this startup idea is to build:

Title: ${input.title}
${input.summary ? `Summary: ${input.summary}` : ''}
${input.aiReview ? `\n\nAI Review Analysis:\n${input.aiReview}\n\nUse the insights from the AI Review above to inform your feasibility assessment.` : ''}

Evaluate:
1. Technical complexity and required expertise
2. Dependencies and infrastructure needs
3. Regulatory and compliance requirements
4. Time to market estimates
5. Resource requirements (team, budget, tools)

Provide your assessment as JSON with score, rationale, and key signals.`;

    return callValidationAgent('feasibility', systemPrompt, userPrompt);
  },
};

