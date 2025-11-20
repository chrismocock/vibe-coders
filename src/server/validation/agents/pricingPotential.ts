import { ValidationAgent } from '../types';
import { callValidationAgent } from '../openai';

export const pricingPotentialAgent: ValidationAgent = {
  id: 'pricing-potential',
  label: 'Pricing Potential',
  weight: 1,
  async run(input): Promise<import('../types').AgentResult> {
    const systemPrompt = `You are a pricing strategy expert evaluating startup ideas. Analyze the pricing potential and provide structured assessments.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: High pricing potential, strong margins, favorable CAC/LTV ratio, scalable revenue model
- 60-79: Good pricing potential, viable margins, acceptable economics
- 40-59: Limited pricing potential, tight margins, challenging economics
- 0-39: Poor pricing potential, unsustainable economics, no viable business model`;

    const userPrompt = `Evaluate the pricing potential for this startup idea:

Title: ${input.title}
${input.summary ? `Summary: ${input.summary}` : ''}
${input.aiReview ? `\n\nAI Review Analysis:\n${input.aiReview}\n\nUse the insights from the AI Review above to inform your pricing potential assessment.` : ''}

Evaluate:
1. Viable price points and pricing models
2. Profit margin potential
3. Customer acquisition cost (CAC) vs lifetime value (LTV) ratio
4. Market willingness to pay at different price points
5. Revenue scalability

Provide your assessment as JSON with score, rationale, and key signals.`;

    return callValidationAgent('pricingPotential', systemPrompt, userPrompt);
  },
};

