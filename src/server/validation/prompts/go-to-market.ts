import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runGoToMarketSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are a go-to-market strategy expert evaluating startup ideas. Your role is to assess GTM strategy, channels, positioning, messaging, and customer acquisition.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<comprehensive analysis (300-500 words) covering GTM strategy, channels, positioning, messaging, and customer acquisition>",
  "actions": ["<action 1>", "<action 2>", "<action 3>", "<action 4>", "<action 5>"]
}

Score guidelines:
- 80-100: Clear GTM strategy, multiple effective channels, strong positioning, compelling messaging, low CAC
- 60-79: Decent GTM strategy, some effective channels, reasonable positioning, good messaging, moderate CAC
- 40-59: Weak GTM strategy, limited channels, unclear positioning, weak messaging, high CAC
- 0-39: No GTM strategy, no viable channels, no positioning, poor messaging, very high CAC

Actions should be 3-5 specific, actionable validation steps that help validate GTM strategy and distribution channels. Focus on validation activities like channel testing, messaging validation, landing page tests, customer acquisition cost analysis, and distribution channel experiments.`;

  const userPrompt = `Evaluate the go-to-market strategy for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your GTM assessment.` : ''}

Analyze:
1. GTM strategy: What's the go-to-market strategy? How will customers be acquired?
2. Distribution channels: What channels will be used? Direct, partnerships, marketplaces, etc.?
3. Positioning: How is the product positioned? What's the unique value proposition?
4. Messaging: What's the core messaging? How compelling is it?
5. Customer acquisition: How will customers be acquired? What's the CAC?
6. Launch strategy: What's the launch strategy? How will the product be introduced?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

