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

import { JsonPromptError } from './openai';
import { generatePillars } from './pillars';

describe('generatePillars', () => {
  beforeEach(() => {
    callJsonPromptMock.mockReset();
  });

  it('recovers when schema validation fails but usable pillars exist', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        pillars: [
          {
            pillarId: 'audienceFit',
            pillarName: 'Audience Fit',
            score: '8',
            analysis: 'Too short',
            strength: 'brief',
            weakness: 'brief',
            improvementSuggestion: 'Expand scope',
          },
          {
            pillarId: 'marketSize',
            pillarName: 'Market Size (TAM/SAM)',
            score: 4,
            analysis: 'Short',
            strength: 'OK signal',
            weakness: 'Low demand',
            improvementSuggestion: 'Quantify more data',
          },
        ],
      },
      meta: { tokens: 0, duration: 1 },
    });

    const pillars = await generatePillars({ title: 'Test Idea', summary: 'Great summary' });

    expect(pillars).toHaveLength(7);
    expect(pillars.find((pillar) => pillar.pillarId === 'audienceFit')?.score).toBe(8);
    expect(callJsonPromptMock).toHaveBeenCalledTimes(1);
  });

  it('throws a JsonPromptError when no usable pillars are returned', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {},
      meta: { tokens: 0, duration: 1 },
    });

    await expect(
      generatePillars({ title: 'Test Idea', summary: 'Fallback validation' }),
    ).rejects.toBeInstanceOf(JsonPromptError);
  });

  it('normalises AI-provided Market Size & Demand Signals pillars', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        pillars: [
          {
            pillarName: 'Market Size & Demand Signals',
            score: '7',
            analysis: 'Clear demand signals and healthy search interest.',
            strength: 'Search interest shows early traction.',
            weakness: 'Needs more segmented TAM view.',
            improvementSuggestion: 'Quantify demand by cohort and region.',
          },
        ],
      },
      meta: { tokens: 0, duration: 1 },
    });

    const pillars = await generatePillars({ title: 'Test Idea', summary: 'Great summary' });

    const marketSizePillar = pillars.find((pillar) => pillar.pillarId === 'marketSize');
    expect(marketSizePillar?.score).toBe(7);
    expect(marketSizePillar?.analysis).toBe('Clear demand signals and healthy search interest.');
    expect(marketSizePillar?.strength).toBe('Search interest shows early traction.');
    expect(marketSizePillar?.weakness).toBe('Needs more segmented TAM view.');
    expect(marketSizePillar?.improvementSuggestion).toBe(
      'Quantify demand by cohort and region.',
    );
  });

  it('normalises Feasibility & Build Complexity when provided as a pillarName', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        pillars: [
          {
            pillarName: 'Feasibility & Build Complexity (Vibe Coding Tools)',
            score: 9,
            analysis: 'Straightforward to build with existing AI tooling.',
            strength: 'Clear build path leveraging vibe coding.',
            weakness: 'Integration testing effort required.',
            improvementSuggestion: 'Prototype core flows using hosted LLMs first.',
          },
        ],
      },
      meta: { tokens: 0, duration: 1 },
    });

    const pillars = await generatePillars({ title: 'Test Idea', summary: 'Great summary' });

    const feasibility = pillars.find((pillar) => pillar.pillarId === 'feasibility');
    expect(feasibility?.score).toBe(9);
    expect(feasibility?.analysis).toBe('Straightforward to build with existing AI tooling.');
    expect(feasibility?.strength).toBe('Clear build path leveraging vibe coding.');
    expect(feasibility?.weakness).toBe('Integration testing effort required.');
    expect(feasibility?.improvementSuggestion).toBe(
      'Prototype core flows using hosted LLMs first.',
    );
  });

  it('normalises Feasibility & Build Complexity when provided as a pillarId', async () => {
    callJsonPromptMock.mockResolvedValue({
      data: {
        pillars: [
          {
            pillarId: 'Feasibility & Build Complexity',
            analysis: 'Moderate complexity with some bespoke integrations.',
            strength: 'Core workflows align with available AI services.',
            weakness: 'Ops overhead could increase with scale.',
            improvementSuggestion: 'Define MVP boundaries to limit initial scope.',
          },
        ],
      },
      meta: { tokens: 0, duration: 1 },
    });

    const pillars = await generatePillars({ title: 'Test Idea', summary: 'Great summary' });

    const feasibility = pillars.find((pillar) => pillar.pillarId === 'feasibility');
    expect(feasibility?.analysis).toBe(
      'Moderate complexity with some bespoke integrations.',
    );
    expect(feasibility?.strength).toBe('Core workflows align with available AI services.');
    expect(feasibility?.weakness).toBe('Ops overhead could increase with scale.');
    expect(feasibility?.improvementSuggestion).toBe(
      'Define MVP boundaries to limit initial scope.',
    );
  });
});
