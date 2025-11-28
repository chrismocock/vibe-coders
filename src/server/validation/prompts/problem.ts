import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runProblemSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are an expert startup validation consultant specializing in problem analysis. Your role is to evaluate how well-defined, urgent, and valuable a problem is for a startup idea.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<120-160 word narrative on the problem>",
  "insightBreakdown": {
    "discoveries": "<Key problem evidence you uncovered>",
    "meaning": "<What those discoveries mean>",
    "impact": "<Impact on solution viability>",
    "recommendations": "<Specific change to make>"
  },
  "actions": ["<3-5 sharp validation actions>"],
  "suggestions": {
    "features": ["<feature opportunity>"],
    "positioning": ["<positioning or messaging insight>"],
    "audience": ["<audience nuance or segment>"],
    "copy": ["<copy or headline hook>"]
  }
}

Score guidelines:
- 80-100: Problem is crystal clear, highly urgent, affects many people frequently, strong problem-solution fit
- 60-79: Problem is well-defined, moderately urgent, affects a reasonable number of people, decent problem-solution fit
- 40-59: Problem is somewhat vague, low urgency, affects niche audience, weak problem-solution fit
- 0-39: Problem is unclear, not urgent, affects very few people, poor problem-solution fit

Actions and suggestions must be specific founder-ready moves (no generic advice).`;

  const userPrompt = `Evaluate the problem for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your problem analysis.` : ''}

Analyze:
1. Problem clarity: How well-defined is the problem? Is it specific and understandable?
2. Problem urgency: How urgent is solving this problem? Do people actively seek solutions?
3. Problem severity: How severe is the problem? What's the cost of not solving it?
4. Problem frequency: How often do people encounter this problem?
5. Problem-solution fit: Does the proposed solution directly address the problem?
6. Problem validation: What evidence exists that this is a real problem?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

