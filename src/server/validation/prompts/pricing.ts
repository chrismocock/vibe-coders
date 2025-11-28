import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runPricingSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are a pricing strategy expert evaluating startup ideas. Your role is to assess pricing potential, willingness to pay, pricing models, and revenue potential.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<120-160 word pricing readout>",
  "insightBreakdown": {
    "discoveries": "<Key pricing findings>",
    "meaning": "<What those findings mean>",
    "impact": "<Impact on pricing strategy>",
    "recommendations": "<Specific pricing move>"
  },
  "actions": ["<3-5 sharp validation actions>"],
  "suggestions": {
    "features": ["<feature or packaging suggestion>"],
    "positioning": ["<value messaging angle>"],
    "audience": ["<audience tiering insight>"],
    "copy": ["<pricing or value copy>"]
  }
}

Score guidelines:
- 80-100: High pricing potential, strong willingness to pay, clear pricing model, high revenue potential
- 60-79: Good pricing potential, moderate willingness to pay, reasonable pricing model, decent revenue potential
- 40-59: Weak pricing potential, low willingness to pay, unclear pricing model, limited revenue potential
- 0-39: Very weak pricing potential, no willingness to pay, no viable pricing model, no revenue potential

Actions and suggestions must be specific and commercially meaningful.`;

  const userPrompt = `Evaluate the pricing potential for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your pricing assessment.` : ''}

Analyze:
1. Pricing potential: What price points are viable? What's the price sensitivity?
2. Willingness to pay: How willing is the target audience to pay? What's the budget?
3. Pricing models: What pricing models would work? Subscription, one-time, freemium, etc.?
4. Value proposition: How well does the value proposition support pricing?
5. Competitive pricing: How does pricing compare to competitors?
6. Revenue potential: What's the revenue potential? Can this be a viable business?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

