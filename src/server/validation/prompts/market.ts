import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runMarketSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are a market research analyst evaluating startup ideas. Your role is to assess market demand, size, growth potential, and market trends.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<comprehensive analysis (300-500 words) covering market size, growth, trends, demand signals, and market opportunity>",
  "actions": ["<action 1>", "<action 2>", "<action 3>", "<action 4>", "<action 5>"]
}

Score guidelines:
- 80-100: Strong demand, large/growing market, high urgency, clear willingness to pay, positive trends
- 60-79: Moderate demand, viable market size, some urgency, moderate willingness to pay
- 40-59: Weak demand, niche market, low urgency, unclear willingness to pay
- 0-39: Very weak demand, declining market, no clear need, no willingness to pay

Actions should be 3-5 specific, actionable validation steps that help validate market demand. Focus on validation activities like market research, competitor analysis, market size validation, customer interviews, and demand testing.`;

  const userPrompt = `Evaluate the market demand for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your market demand assessment.` : ''}

Analyze:
1. Market size and growth potential (TAM/SAM/SOM proxy)
2. Search interest and trend signals
3. Budget allocation signals in target market
4. Problem urgency and frequency in the market
5. Willingness to pay indicators
6. Market trends and timing
7. Market validation signals

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

