import { getAIConfig, defaultAIConfigs, substitutePromptTemplate } from '@/lib/aiConfig';
import {
  IdeateInitialFeedbackData,
  normalizeInitialFeedbackData,
} from '@/lib/ideate/pillars';
import { callJsonPrompt } from '@/server/validation/openai';

interface SelectedIdea {
  title?: string | null;
  description?: string | null;
}

export interface IdeateInitialFeedbackInput {
  mode?: string | null;
  userInput?: string | null;
  selectedIdea?: SelectedIdea | null;
  targetMarket?: string | null;
  targetCountry?: string | null;
  budget?: string | null;
  timescales?: string | null;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert startup evaluator providing quick initial feedback on startup ideas. Based on the AI review provided, analyze the idea across 5 key dimensions and provide a structured assessment.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "recommendation": "build" | "revise" | "drop",
  "overallConfidence": number (0-100),
  "scores": {
    "audienceFit": { "score": number (0-100), "rationale": "string" },
    "competition": { "score": number (0-100), "rationale": "string" },
    "marketDemand": { "score": number (0-100), "rationale": "string" },
    "feasibility": { "score": number (0-100), "rationale": "string" },
    "pricingPotential": { "score": number (0-100), "rationale": "string" }
  }
}

**Scoring Guidelines:**
- **audienceFit**: How well-defined and accessible is the target audience? (0-100)
- **competition**: How competitive is the market? Lower score = more competitive/challenging (0-100)
- **marketDemand**: How strong is the demand for this solution? (0-100)
- **feasibility**: How realistic is it to build this with given resources? (0-100)
- **pricingPotential**: How likely are customers to pay for this? (0-100)

**Recommendation Logic:**
- "build": overallConfidence >= 70
- "revise": overallConfidence >= 40 and < 70
- "drop": overallConfidence < 40

**Overall Confidence Calculation:**
Calculate as weighted average: (audienceFit * 0.2 + competition * 0.2 + marketDemand * 0.25 + feasibility * 0.15 + pricingPotential * 0.2)

**Rationale Requirements:**
- Each rationale should be 1-2 sentences
- Reference specific points from the AI review
- Be honest and constructive
- Focus on actionable insights

Respond with ONLY the JSON object, no other text.`;

const DEFAULT_USER_PROMPT_PREFIX = `Based on the following AI review and idea details, provide initial feedback with scores and recommendations:

Idea Context:
`;

function buildIdeaContext(input: IdeateInitialFeedbackInput): string {
  const { mode, userInput, selectedIdea } = input;
  if (mode === 'surprise-me' && selectedIdea) {
    const title = selectedIdea.title?.trim() || 'Selected Idea';
    const description = selectedIdea.description?.trim() || 'No description provided.';
    return `Selected Idea:
Title: ${title}
Description: ${description}`;
  }

  if (mode === 'explore-idea' && userInput) {
    return `Idea to Explore:
${userInput}`;
  }

  if (mode === 'solve-problem' && userInput) {
    return `Problem to Solve:
${userInput}`;
  }

  return userInput?.trim() ? userInput : 'No context provided.';
}

function buildAdditionalContext(input: IdeateInitialFeedbackInput): string {
  let additional = '';
  if (input.targetMarket) {
    additional += `\nTarget Market: ${input.targetMarket}`;
  }
  if (input.targetCountry) {
    additional += `\nTarget Country: ${input.targetCountry}`;
  }
  if (input.budget) {
    additional += `\nBudget: ${input.budget}`;
  }
  if (input.timescales) {
    additional += `\nTimescales: ${input.timescales}`;
  }
  return additional;
}

function buildFallbackUserPrompt(
  context: string,
  additionalContext: string,
  aiReview: string,
): string {
  return `${DEFAULT_USER_PROMPT_PREFIX}${context}${additionalContext}

AI Review:
${aiReview}

Provide structured feedback with scores for each validation dimension.`;
}

export async function runIdeateInitialFeedback(
  input: IdeateInitialFeedbackInput,
  aiReview: string,
): Promise<IdeateInitialFeedbackData> {
  if (!aiReview?.trim()) {
    throw new Error('AI Review is required');
  }

  const config = await getAIConfig('ideate');
  const fallbackConfig = defaultAIConfigs.ideate;

  const systemPrompt =
    config?.system_prompt_initial_feedback ??
    fallbackConfig?.system_prompt_initial_feedback ??
    DEFAULT_SYSTEM_PROMPT;
  const userPromptTemplate =
    config?.user_prompt_template_initial_feedback ??
    fallbackConfig?.user_prompt_template_initial_feedback ??
    '';

  const ideaContext = buildIdeaContext(input);
  const additionalContext = buildAdditionalContext(input);

  const variables = {
    mode: input.mode || '',
    ideaContext,
    additionalContext,
    aiReview,
  };

  const userPrompt = userPromptTemplate
    ? substitutePromptTemplate(userPromptTemplate, variables)
    : buildFallbackUserPrompt(ideaContext, additionalContext, aiReview);

  const { data } = await callJsonPrompt<unknown>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    timeoutMs: 60000,
  });

  return normalizeInitialFeedbackData(data);
}
