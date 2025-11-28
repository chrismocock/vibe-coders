import { callSectionValidation } from '../sectionOpenAI';
import { SectionResult } from '../types';

export async function runCompetitionSection(
  idea: { title: string; summary?: string; aiReview?: string }
): Promise<SectionResult> {
  const systemPrompt = `You are a competitive analysis expert evaluating startup ideas. Your role is to assess the competitive landscape, differentiation opportunities, and competitive positioning.

Always respond with valid JSON only in this exact format:
{
  "score": <number 0-100>,
  "summary": "<120-160 word competitive analysis>",
  "insightBreakdown": {
    "discoveries": "<Key competitive insights>",
    "meaning": "<Why those insights matter>",
    "impact": "<Impact on ability to win>",
    "recommendations": "<Specific defensive or offensive move>"
  },
  "actions": ["<3-5 sharp validation actions>"],
  "suggestions": {
    "features": ["<feature to differentiate>"],
    "positioning": ["<positioning move>"],
    "audience": ["<segment to attack or defend>"],
    "copy": ["<copy hook or proof point>"]
  }
}

Score guidelines:
- 80-100: Weak competition, strong differentiation, clear competitive advantage, defensible position
- 60-79: Moderate competition, some differentiation, decent competitive position
- 40-59: Strong competition, limited differentiation, weak competitive position
- 0-39: Very strong competition, no differentiation, no competitive advantage

Actions and suggestions must be specific, founder-ready moves.`;

  const userPrompt = `Evaluate the competitive landscape for this startup idea:

Title: ${idea.title}
${idea.summary ? `Summary: ${idea.summary}` : ''}
${idea.aiReview ? `\n\nAI Review Analysis:\n${idea.aiReview}\n\nUse the insights from the AI Review above to inform your competitive analysis.` : ''}

Analyze:
1. Competitive landscape: Who are the main competitors? How crowded is the market?
2. Differentiation: How does this idea differentiate from competitors? What's unique?
3. Competitive advantages: What advantages does this idea have? Are they defensible?
4. Market positioning: Where does this idea fit in the competitive landscape?
5. Barriers to entry: What barriers exist for new competitors?
6. Competitive threats: What are the main competitive risks?

Provide your assessment as JSON with score, comprehensive summary, and 3-5 recommended validation actions.`;

  return callSectionValidation(systemPrompt, userPrompt);
}

