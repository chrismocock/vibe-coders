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
3. Personas (1–4 personas, aim for 2–3):
   Each persona must have:
   - name: A clear persona name (2-60 characters)
   - role: Optional role or descriptor (e.g., "Solo founder", "Marketing manager")
   - summary: A 20-220 character description of who this persona is and what they expect
   - needs: An array of 2-5 primary needs (each at least 4 characters)
   - motivations: Optional array of 1-4 motivations (each at least 4 characters)
   - painPoints: Optional array of 1-4 pain points or frustrations (each at least 4 characters)
4. Solution Description
   - A clear explanation of what the product does and how it works.
5. Core Features
   - An array of 1-10 feature descriptions (each 4-140 characters) for MVP → V1.
6. Unique Value Proposition
   - Why this solution is better than alternatives.
7. Competition Summary
   - Key competitors + differentiation.
8. Monetisation Model
   - An array of 1-4 monetisation options, each with:
     - model: The revenue model name (3-80 characters)
     - description: How it works (15-240 characters)
     - pricingNotes: Optional pricing details (8-200 characters)
9. Market Size (Directional)
   - Is this a niche, mid-size, or large market?
   - Is interest growing?
10. Build Notes (Vibe Coding Context)
    - What is easy, moderate, or hard to build using AI-assisted development.
11. Risks & Mitigations
    - An array of 1-5 risks, each with:
      - risk: The risk description (10-200 characters)
      - mitigation: How to address it (10-220 characters)

OUTPUT FORMAT
Return ONLY valid JSON matching this exact structure:
{
  "aiProductOverview": {
    "refinedPitch": "string (20-320 chars)",
    "problemSummary": "string (30-320 chars)",
    "personas": [
      {
        "name": "string (2-60 chars)",
        "role": "string (3-80 chars, optional)",
        "summary": "string (20-220 chars)",
        "needs": ["string (min 4 chars)", ...],
        "motivations": ["string (min 4 chars, optional)", ...],
        "painPoints": ["string (min 4 chars, optional)", ...]
      }
    ],
    "solution": "string (40-400 chars)",
    "coreFeatures": ["string (4-140 chars)", ...],
    "uniqueValue": "string (25-320 chars)",
    "competition": "string (25-320 chars)",
    "monetisation": [
      {
        "model": "string (3-80 chars)",
        "description": "string (15-240 chars)",
        "pricingNotes": "string (8-200 chars, optional)"
      }
    ],
    "marketSize": "string (25-320 chars)",
    "buildNotes": "string (25-360 chars)",
    "risks": [
      {
        "risk": "string (10-200 chars)",
        "mitigation": "string (10-220 chars)"
      }
    ]
  }
}

CRITICAL: All fields must match the schema exactly. Ensure:
- All string fields meet their min/max length requirements
- Arrays have the correct number of items (personas: 1-4, coreFeatures: 1-10, monetisation: 1-4, risks: 1-5)
- Persona objects include required "name" and "summary" fields
- All array items meet their individual length requirements
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


