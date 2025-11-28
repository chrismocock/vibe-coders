import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runFeasibilitySection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are a technical feasibility expert evaluating startup ideas. Your role is to assess technical feasibility, resource requirements, timeline, and implementation complexity.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<120-160 word feasibility readout>",
  "insightBreakdown": {
    "discoveries": "<Key feasibility findings>",
    "meaning": "<What that means operationally>",
    "impact": "<Impact on delivery speed or quality>",
    "recommendations": "<Specific mitigation>"
  },
  "actions": ["<3-5 sharp validation actions>"],
  "suggestions": {
    "features": ["<technical feature trade-off>"],
    "positioning": ["<feasibility-based positioning insight>"],
    "audience": ["<audience implication if any>"],
    "copy": ["<copy suggestion to set expectations>"]
  }
}

Score guidelines:
- 80-100: Highly feasible, minimal resources needed, short timeline, low complexity, proven technology
- 60-79: Feasible, reasonable resources needed, moderate timeline, manageable complexity
- 40-59: Challenging feasibility, significant resources needed, long timeline, high complexity
- 0-39: Not feasible, excessive resources needed, unrealistic timeline, very high complexity

Actions and suggestions must be concrete and execution ready.`;

  const userPrompt = `Evaluate the technical feasibility for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your feasibility assessment.` : ''}

Analyze:
1. Technical feasibility: Is the technology required available and proven?
2. Resource requirements: What resources are needed? Team size, skills, budget?
3. Timeline: How long would it take to build? Is this realistic?
4. Implementation complexity: How complex is the implementation? What are the main challenges?
5. Technical risks: What are the main technical risks? How can they be mitigated?
6. MVP feasibility: Can a viable MVP be built quickly? What's the minimum viable version?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

