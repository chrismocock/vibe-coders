import { ValidationAgent } from '../types';
import { callValidationAgent } from '../openai';

export const marketDemandAgent: ValidationAgent = {
  id: 'market-demand',
  label: 'Market Demand',
  weight: 1,
  async run(input): Promise<import('../types').AgentResult> {
    const systemPrompt = `You are a market research analyst evaluating startup ideas. Analyze the market demand for ideas and provide structured assessments.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Strong demand, large/growing market, high urgency, clear willingness to pay
- 60-79: Moderate demand, viable market size, some urgency
- 40-59: Weak demand, niche market, low urgency
- 0-39: Very weak demand, declining market, no clear need`;

    const userPrompt = `Evaluate the market demand for this startup idea:

Title: ${input.title}
${input.summary ? `Summary: ${input.summary}` : ''}
${input.aiReview ? `\n\nAI Review Analysis:\n${input.aiReview}\n\nUse the insights from the AI Review above to inform your market demand assessment.` : ''}

Evaluate:
1. Market size and growth potential (TAM/SAM/SOM proxy)
2. Search interest and trend signals
3. Budget allocation signals in target market
4. Problem urgency and frequency
5. Willingness to pay indicators

Provide your assessment as JSON with score, rationale, and key signals.`;

    return callValidationAgent('marketDemand', systemPrompt, userPrompt);
  },
};

