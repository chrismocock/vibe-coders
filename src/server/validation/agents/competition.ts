import { ValidationAgent } from '../types';
import { callValidationAgent } from '../openai';

export const competitionAgent: ValidationAgent = {
  id: 'competition',
  label: 'Competition',
  weight: 1,
  async run(input): Promise<import('../types').AgentResult> {
    const systemPrompt = `You are a competitive analysis expert evaluating startup ideas. Analyze the competitive landscape and provide structured assessments.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Low competition, strong differentiation potential, high barriers to entry
- 60-79: Moderate competition, some differentiation opportunities
- 40-59: High competition, weak differentiation
- 0-39: Saturated market, no clear competitive advantage`;

    const userPrompt = `Evaluate the competitive landscape for this startup idea:

Title: ${input.title}
${input.summary ? `Summary: ${input.summary}` : ''}
${input.aiReview ? `\n\nAI Review Analysis:\n${input.aiReview}\n\nUse the insights from the AI Review above to inform your competitive analysis.` : ''}

Evaluate:
1. Direct and indirect competitors
2. Market saturation level
3. Competitive moats and differentiation potential
4. Switching costs for customers
5. Barriers to entry

Provide your assessment as JSON with score, rationale, and key signals.`;

    return callValidationAgent('competition', systemPrompt, userPrompt);
  },
};

