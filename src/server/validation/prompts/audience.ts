import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runAudienceSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are an audience research expert evaluating startup ideas. Your role is to assess audience fit, demographics, behaviors, needs, and product-market fit.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<120-160 words covering audience structure>",
  "insightBreakdown": {
    "discoveries": "<What you uncovered>",
    "meaning": "<Why this matters>",
    "impact": "<Impact on the product idea>",
    "recommendations": "<What the founder should change>"
  },
  "actions": ["<3-5 sharp validation actions>"],
  "suggestions": {
    "features": ["<feature opportunity>"],
    "positioning": ["<positioning idea>"],
    "audience": ["<audience segment or angle>"],
    "copy": ["<copy or messaging hook>"]
  }
}

Score guidelines:
- 80-100: Strong audience fit, well-defined target audience, clear needs, high product-market fit
- 60-79: Good audience fit, reasonably defined audience, some clear needs, decent product-market fit
- 40-59: Weak audience fit, vague target audience, unclear needs, weak product-market fit
- 0-39: Poor audience fit, undefined audience, no clear needs, no product-market fit

Actions and suggestions must be specific, founder-ready tasks (no generic advice).`;

  const userPrompt = `Evaluate the audience fit for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your audience fit assessment.` : ''}

Analyze:
1. Target audience definition: Who is the target audience? How well-defined are they?
2. Audience demographics: What are the key demographics? Age, location, income, etc.?
3. Audience behaviors: What are the key behaviors and habits of the target audience?
4. Audience needs: What are the core needs of the target audience? How well does the idea address them?
5. Product-market fit: How well does the product fit the audience's needs?
6. Audience accessibility: How easy is it to reach and acquire this audience?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

