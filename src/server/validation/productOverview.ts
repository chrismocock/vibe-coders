import { ZodError } from 'zod';
import {
  AIProductOverviewSchema,
  ProductOverviewPromptInput,
} from '@/lib/ai/prompts/validation/productOverview';
import { callJsonPrompt, JsonPromptError } from './openai';
import { AIProductOverview } from './types';

export type ValidationAIErrorKind = 'input' | 'config' | 'timeout' | 'provider' | 'schema';

export class ValidationAIError extends Error {
  constructor(
    message: string,
    public kind: ValidationAIErrorKind,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'ValidationAIError';
    if (options?.cause) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export type ProductOverviewServiceInput = ProductOverviewPromptInput;

const PRODUCT_OVERVIEW_SYSTEM_PROMPT = `You are creating an AI Product Overview for a startup idea based on:
- The user’s ideation summary
- The full seven-pillar validation analysis

Your job is to produce a polished, design-ready brief that represents the improved version of the idea.
Be structured, concise, clear, and realistic.
Do NOT repeat the user’s text — refine and strengthen it.

REQUIRED SECTIONS
1. Refined Elevator Pitch
   - A 1–2 sentence improved version of the product’s value proposition.
2. Problem Summary
   - What problem this solves and why it matters.
3. Personas (2–3 personas):
   - role
   - goal
   - motivation
   - frustrations
   - what triggers adoption
4. Solution Description
   - A clear explanation of what the product does and how it works.
5. Core Features
   - A bullet-point feature list for MVP → V1.
6. Unique Value Proposition
   - Why this solution is better than alternatives.
7. Competition Summary
   - Key competitors + differentiation.
8. Monetisation Model
   - Best revenue options + reasoning.
9. Market Size (Directional)
   - Is this a niche, mid-size, or large market?
   - Is interest growing?
10. Build Notes (Vibe Coding Context)
    - What is easy, moderate, or hard to build using AI-assisted development.
11. Risks & Mitigations
    - Be honest but constructive.

OUTPUT FORMAT
Return ONLY:
{
  "aiProductOverview": {
    "refinedPitch": "",
    "problemSummary": "",
    "personas": [],
    "solution": "",
    "coreFeatures": [],
    "competition": "",
    "uniqueValue": "",
    "monetisation": [],
    "marketSize": "",
    "buildNotes": "",
    "risks": []
  }
}

All fields must be present.
Keep output practical and design-ready.`;

function buildProductOverviewPrompt(input: ProductOverviewPromptInput) {
  const title = input.title?.trim() || 'Untitled Idea';
  const summary = input.summary?.trim() || 'No summary provided.';
  const context = input.context?.trim();
  const contextBlock = context ? `\nAdditional Context:\n${context}\n` : '';
  const pillarDiagnostics = input.pillars
    .map(
      (pillar) => `${pillar.pillarName} (${pillar.score}/10)
Analysis: ${pillar.analysis}
Strength: ${pillar.strength}
Weakness: ${pillar.weakness}
Improve: ${pillar.improvementSuggestion}`,
    )
    .join('\n\n');

  const userPrompt = `Idea Title: ${title}
Ideation Summary:
${summary}${contextBlock}
Seven-Pillar Validation Insights:
${pillarDiagnostics || 'Not provided.'}

Follow the required sections and respond with the exact JSON schema.`;

  return {
    systemPrompt: PRODUCT_OVERVIEW_SYSTEM_PROMPT,
    userPrompt,
  };
}

export async function generateProductOverview(
  input: ProductOverviewServiceInput,
): Promise<AIProductOverview> {
  const summary = input.summary?.trim();
  if (!summary) {
    throw new ValidationAIError(
      'Idea summary is required to generate the AI Product Overview',
      'input',
    );
  }

  const prompts = buildProductOverviewPrompt({
    ...input,
    title: input.title?.trim() || 'Untitled Idea',
    summary,
    context: input.context?.trim(),
  });

  try {
    const { data } = await callJsonPrompt({
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      temperature: 0.55,
      timeoutMs: 60000,
    });

    const parsed = AIProductOverviewSchema.parse(data);
    return parsed.aiProductOverview;
  } catch (error) {
    if (error instanceof ValidationAIError) {
      throw error;
    }

    if (error instanceof JsonPromptError) {
      const kindMap: Record<JsonPromptError['kind'], ValidationAIErrorKind> = {
        config: 'config',
        timeout: 'timeout',
        bad_response: 'schema',
        openai: 'provider',
      };

      const messageMap: Record<JsonPromptError['kind'], string> = {
        config: error.message,
        timeout: 'OpenAI timed out while generating the AI Product Overview. Please retry.',
        bad_response: 'OpenAI returned an unexpected shape for the AI Product Overview.',
        openai: 'OpenAI failed while generating the AI Product Overview.',
      };

      throw new ValidationAIError(messageMap[error.kind], kindMap[error.kind], { cause: error });
    }

    if (error instanceof ZodError) {
      throw new ValidationAIError(
        'AI Product Overview response failed schema validation.',
        'schema',
        { cause: error },
      );
    }

    throw new ValidationAIError('Unexpected error while generating AI Product Overview.', 'provider', {
      cause: error,
    });
  }
}


