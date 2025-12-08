import { beforeEach, describe, expect, it, vi } from 'vitest';

const callJsonPromptMock = vi.hoisted(() => vi.fn());

type JsonPromptErrorKind = 'config' | 'timeout' | 'bad_response' | 'openai';

vi.mock('./openai', () => {
  class MockJsonPromptError extends Error {
    kind: JsonPromptErrorKind;

    constructor(message: string, kind: JsonPromptErrorKind, options?: { cause?: unknown }) {
      super(message);
      this.name = 'JsonPromptError';
      this.kind = kind;
      if (options?.cause) {
        (this as Error & { cause?: unknown }).cause = options.cause;
      }
    }
  }

  return {
    callJsonPrompt: callJsonPromptMock,
    JsonPromptError: MockJsonPromptError,
  };
});

import { ValidationAIError, generateProductOverview } from './productOverview';

describe('generateProductOverview', () => {
  beforeEach(() => {
    callJsonPromptMock.mockReset();
  });

  it('allows empty optional persona arrays without failing schema validation', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        aiProductOverview: {
          refinedPitch: 'This product helps teams plan projects efficiently with AI assistance.',
          problemSummary: 'Teams struggle to align on project goals and communication across their tools.',
          personas: [
            {
              name: 'Alex Rivera',
              role: 'Product founder',
              summary: 'A founder seeking better planning workflows for distributed product teams.',
              needs: ['Reliable delivery timelines', 'Clear collaboration rituals'],
              motivations: [],
              painPoints: [],
            },
          ],
          solution:
            'The platform provides automated planning suggestions, risk flags, and collaboration tools tailored to each sprint.',
          coreFeatures: ['AI planning workspace'],
          uniqueValue: 'Delivers unified AI planning with automation and build guardrails for teams.',
          competition: 'Competes with basic PM tools but adds AI guidance and integrated collaboration.',
          monetisation: [
            {
              model: 'Subscription',
              description: 'Monthly per-seat pricing with optional AI usage tiers.',
            },
          ],
          marketSize: 'Large market of product teams needing clearer planning workflows.',
          buildNotes: 'Core is straightforward with existing AI APIs; integrations add moderate complexity.',
          risks: [
            {
              risk: 'Teams may resist switching from existing tools.',
              mitigation: 'Offer easy imports and launch with strong onboarding prompts.',
            },
          ],
        },
      },
      meta: { tokens: 0, duration: 1 },
    });

    const overview = await generateProductOverview({
      title: 'AI Planning Workspace',
      summary: 'An AI assistant that improves planning for distributed teams.',
      pillars: [],
    });

    expect(overview.personas[0].motivations).toBeUndefined();
    expect(overview.personas[0].painPoints).toBeUndefined();
    expect(callJsonPromptMock).toHaveBeenCalledTimes(1);
  });

  it('returns schema error metadata when AI response fails validation', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        aiProductOverview: {
          refinedPitch: 'This product helps teams plan projects efficiently with AI assistance.',
          problemSummary: 'Teams struggle to align on project goals and communication across their tools.',
          personas: [
            {
              name: 'Alex Rivera',
              role: 'Product founder',
              summary: 'A founder seeking better planning workflows for distributed product teams.',
              needs: ['Reliable delivery timelines'],
            },
          ],
          solution:
            'The platform provides automated planning suggestions, risk flags, and collaboration tools tailored to each sprint.',
          coreFeatures: ['AI planning workspace'],
          uniqueValue: 'Delivers unified AI planning with automation and build guardrails for teams.',
          competition: 'Competes with basic PM tools but adds AI guidance and integrated collaboration.',
          monetisation: [
            {
              model: 'Subscription',
              description: 'Monthly per-seat pricing with optional AI usage tiers.',
            },
          ],
          marketSize: 'Large market of product teams needing clearer planning workflows.',
          buildNotes: 'Core is straightforward with existing AI APIs; integrations add moderate complexity.',
          risks: [
            {
              risk: 'Teams may resist switching from existing tools.',
              mitigation: 'Offer easy imports and launch with strong onboarding prompts.',
            },
          ],
        },
      },
      meta: { tokens: 0, duration: 1 },
    });

    const result = generateProductOverview({
      title: 'AI Planning Workspace',
      summary: 'An AI assistant that improves planning for distributed teams.',
      pillars: [],
    });

    await expect(result).rejects.toBeInstanceOf(ValidationAIError);
    await expect(result).rejects.toMatchObject({
      kind: 'schema',
      meta: {
        summary: expect.stringContaining('aiProductOverview.personas.0.needs'),
        issues: expect.arrayContaining([expect.stringContaining('needs')]),
      },
    });
  });
});
