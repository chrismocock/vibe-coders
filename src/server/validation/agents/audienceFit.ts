import { ValidationAgent } from '../types';
import { callValidationAgent } from '../openai';

export const audienceFitAgent: ValidationAgent = {
  id: 'audience-fit',
  label: 'Audience Fit',
  weight: 1,
  async run(input): Promise<import('../types').AgentResult> {
    const systemPrompt = `You are a customer research expert evaluating startup ideas. Analyze how well ideas fit their target audience and provide structured assessments.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Clear ICP, high urgency, strong willingness to pay, excellent product-market fit potential
- 60-79: Defined audience, moderate urgency, some willingness to pay
- 40-59: Unclear audience, low urgency, weak willingness to pay
- 0-39: No clear audience, no urgency, no willingness to pay`;

    const userPrompt = `Evaluate how well this startup idea fits its target audience:

Title: ${input.title}
${input.summary ? `Summary: ${input.summary}` : ''}
${input.aiReview ? `\n\nAI Review Analysis:\n${input.aiReview}\n\nUse the insights from the AI Review above to inform your audience fit assessment.` : ''}

Evaluate:
1. Ideal Customer Profile (ICP) clarity
2. Problem urgency and pain level
3. Willingness to pay and budget availability
4. Product-market fit potential
5. User acquisition feasibility

Provide your assessment as JSON with score, rationale, and key signals.`;

    return callValidationAgent('audienceFit', systemPrompt, userPrompt);
  },
};

