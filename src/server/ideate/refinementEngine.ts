import { z } from 'zod';
import { callJsonPrompt } from '@/server/validation/openai';
import {
  IDEATE_PILLAR_LABELS,
  IdeateInitialFeedbackData,
  IdeatePillarId,
  IdeatePillarSnapshot,
  ImprovementDirection,
  buildPillarSnapshots,
} from '@/lib/ideate/pillars';
import { runIdeateInitialFeedback, IdeateInitialFeedbackInput } from './initialFeedback';

export type ProductOverview = Awaited<
  ReturnType<typeof import('@/server/validation/productOverview')['generateProductOverview']>
>;

export type PillarName = IdeatePillarId;

export type PillarResult = IdeatePillarSnapshot;

export interface SectionDiff {
  section: string;
  before: string;
  after: string;
}

export interface IdeaImprovementResult {
  improvedOverview: ProductOverview;
  differences: SectionDiff[];
  pillarImpacted: PillarName;
  scoreDelta: number;
  beforeSection: string;
  afterSection: string;
  updatedPillars: PillarResult[];
  feedback: IdeateInitialFeedbackData;
  directions: ImprovementDirection[];
  selectedDirectionId?: string;
  selectedDirection?: ImprovementDirection | null;
}

export interface AutoImproveResult {
  finalOverview: ProductOverview;
  finalFeedback: IdeateInitialFeedbackData;
  pillars: PillarResult[];
  iterations: IdeaImprovementResult[];
  reachedTarget: boolean;
}

export interface ImproveIdeaOptions {
  overview: ProductOverview;
  currentFeedback: IdeateInitialFeedbackData;
  feedbackInput: IdeateInitialFeedbackInput;
  targetPillar?: PillarName;
  directions?: ImprovementDirection[];
  selectedDirectionId?: string;
}

export interface AutoImproveOptions {
  overview: ProductOverview;
  currentFeedback: IdeateInitialFeedbackData;
  feedbackInput: IdeateInitialFeedbackInput;
  targetScore?: number;
  maxIterations?: number;
}

export interface GenerateImprovementDirectionsOptions {
  overview: ProductOverview;
  pillar: PillarName;
  weaknessSummary: string;
}

const improvementSchema = z.object({
  improvedOverview: z.unknown(),
  rewrittenSections: z
    .array(
      z.object({
        section: z.string(),
        after: z.string(),
      }),
    )
    .min(1),
  pillarImpacted: z.string().optional(),
});

type OverviewSectionKey = keyof ProductOverview;

const SECTION_TITLES: Record<OverviewSectionKey, string> = {
  refinedPitch: 'Refined Elevator Pitch',
  problemSummary: 'Problem Summary',
  personas: 'Personas',
  solution: 'Solution Description',
  coreFeatures: 'Core Features',
  uniqueValue: 'Unique Value Proposition',
  competition: 'Competition Summary',
  monetisation: 'Monetisation Model',
  marketSize: 'Market Size',
  buildNotes: 'Build Notes',
  risks: 'Risks & Mitigations',
};

const PILLAR_SECTION_MAP: Record<PillarName, OverviewSectionKey[]> = {
  audienceFit: ['problemSummary', 'personas'],
  competition: ['competition', 'uniqueValue'],
  marketDemand: ['marketSize', 'problemSummary'],
  feasibility: ['solution', 'buildNotes'],
  pricingPotential: ['monetisation'],
};

const MAX_ITERATIONS = 5;

function detectWeakestPillar(pillars: PillarResult[]): PillarResult | null {
  if (!pillars?.length) return null;
  return pillars.reduce((weakest, current) =>
    current.score < (weakest?.score ?? Number.POSITIVE_INFINITY) ? current : weakest,
  );
}

function normalizeOverview(base: ProductOverview, incoming: unknown): ProductOverview {
  if (!incoming || typeof incoming !== 'object') return base;
  const normalized = { ...base, ...(incoming as Record<string, unknown>) } as ProductOverview;
  // Always preserve the original elevator pitch - never overwrite it
  normalized.refinedPitch = base.refinedPitch;
  return normalized;
}

function formatArrayValue(
  value: unknown,
  formatter?: (entry: unknown, index: number) => string,
): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  if (formatter) {
    return value.map((entry, index) => formatter(entry, index)).join('\n\n');
  }
  return value.map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2))).join('\n\n');
}

function formatOverviewSection(overview: ProductOverview, key: OverviewSectionKey): string {
  const value = overview[key];
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();

  switch (key) {
    case 'personas':
      return formatArrayValue(value, (persona) => {
        if (!persona || typeof persona !== 'object') return String(persona ?? '');
        const cast = persona as Record<string, unknown>;
        const name = cast.name ? String(cast.name) : 'Persona';
        const role = cast.role ? ` (${String(cast.role)})` : '';
        const summary = cast.summary ? `\nSummary: ${String(cast.summary)}` : '';
        const needs = Array.isArray(cast.needs) && cast.needs.length
          ? `\nNeeds: ${cast.needs.join(', ')}`
          : '';
        return `${name}${role}${summary}${needs}`;
      });
    case 'coreFeatures':
      return formatArrayValue(value, (feature, index) => `${index + 1}. ${String(feature ?? '')}`.trim());
    case 'monetisation':
      return formatArrayValue(value, (entry) => {
        if (!entry || typeof entry !== 'object') return String(entry ?? '');
        const cast = entry as Record<string, unknown>;
        const model = cast.model ? String(cast.model) : 'Model';
        const description = cast.description ? ` — ${String(cast.description)}` : '';
        const notes = cast.pricingNotes ? ` (Notes: ${String(cast.pricingNotes)})` : '';
        return `${model}${description}${notes}`;
      });
    case 'risks':
      return formatArrayValue(value, (entry, index) => {
        if (!entry || typeof entry !== 'object') return `${index + 1}. ${String(entry ?? '')}`;
        const cast = entry as Record<string, unknown>;
        const risk = cast.risk ? String(cast.risk) : 'Risk';
        const mitigation = cast.mitigation ? `\nMitigation: ${String(cast.mitigation)}` : '';
        return `${index + 1}. ${risk}${mitigation}`;
      });
    default:
      if (Array.isArray(value)) {
        return formatArrayValue(value);
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
  }
}

function buildSectionDiffs(
  before: ProductOverview,
  after: ProductOverview,
  sections: OverviewSectionKey[],
): SectionDiff[] {
  const diffs: SectionDiff[] = [];
  for (const sectionKey of sections) {
    const beforeText = formatOverviewSection(before, sectionKey);
    const afterText = formatOverviewSection(after, sectionKey);
    if (beforeText !== afterText) {
      diffs.push({
        section: SECTION_TITLES[sectionKey] ?? sectionKey,
        before: beforeText,
        after: afterText,
      });
    }
  }
  return diffs;
}

function serializeOverviewForFeedback(overview: ProductOverview): string {
  const sections: string[] = [
    `Refined Pitch:\n${overview.refinedPitch}`,
    `Problem Summary:\n${overview.problemSummary}`,
    `Solution:\n${overview.solution}`,
    `Competition:\n${overview.competition}`,
    `Unique Value:\n${overview.uniqueValue}`,
    `Market Size:\n${overview.marketSize}`,
    `Build Notes:\n${overview.buildNotes}`,
    `Monetisation:\n${formatOverviewSection(overview, 'monetisation')}`,
    `Personas:\n${formatOverviewSection(overview, 'personas')}`,
    `Core Features:\n${formatOverviewSection(overview, 'coreFeatures')}`,
    `Risks:\n${formatOverviewSection(overview, 'risks')}`,
  ];
  return sections.join('\n\n').trim();
}

function getSectionsForPillar(pillar: PillarName): OverviewSectionKey[] {
  const sections = PILLAR_SECTION_MAP[pillar];
  // Never include refinedPitch (elevator pitch) in refinements - use solution as fallback instead
  return sections && sections.length ? sections : ['solution'];
}

function buildImprovementPrompt(
  overview: ProductOverview,
  pillar: PillarResult,
  sections: OverviewSectionKey[],
) {
  const sectionPreviews = sections
    .map((key) => {
      const label = SECTION_TITLES[key] ?? key;
      const content = formatOverviewSection(overview, key) || '(empty)';
      return `### ${label}
${content}`;
    })
    .join('\n\n');

  const pillarLabel = IDEATE_PILLAR_LABELS[pillar.pillar] ?? pillar.pillar;

  const systemPrompt = `You are an AI refinement engine. Rewrite Product Overview sections to directly improve the requested pillar.
- Produce polished paragraphs, not advice.
- Keep structure, tone, and factual context intact.
- Only edit the sections that influence the target pillar plus minimal supporting lines to keep the overview coherent.
- Respond with valid JSON only.`;

  const userPrompt = `Product Overview JSON:
${JSON.stringify(overview, null, 2)}

Target Pillar: ${pillarLabel} (${pillar.score}/100)
Identified Weakness: ${pillar.rationale}

Sections that must be rewritten (final text only, no advice):
${sectionPreviews}

Return ONLY JSON in this format:
{
  "improvedOverview": { ...updated overview... },
  "rewrittenSections": [
    { "section": "Section Name", "after": "Final rewritten text" }
  ],
  "pillarImpacted": "${pillar.pillar}"
}`;

  return { systemPrompt, userPrompt };
}

function buildDirectionPrompt(
  overview: ProductOverview,
  pillar: PillarName,
  weaknessSummary: string,
  sections: OverviewSectionKey[],
) {
  const pillarLabel = IDEATE_PILLAR_LABELS[pillar] ?? pillar;
  const sectionPreviews = sections
    .map((key) => {
      const label = SECTION_TITLES[key] ?? key;
      const content = formatOverviewSection(overview, key) || '(empty)';
      return `### ${label}\n${content}`;
    })
    .join('\n\n');

  const systemPrompt = `You are an Ideate-stage strategist. Before rewriting anything, propose multiple conceptual improvement directions for one weak pillar.
- Directions must describe WHAT strategic shift or emphasis should change, not detailed implementation steps.
- Keep ideas grounded in the provided overview context.
- Do not rewrite copy or provide code.
- Aim for 2-3 directions only.
- Respond with valid JSON.`;

  const userPrompt = `Product Overview JSON:
${JSON.stringify(overview, null, 2)}

Target Pillar: ${pillarLabel} (${pillar})
Weakness Summary: ${weaknessSummary || 'Not provided'}

Reference Sections:
${sectionPreviews}

Return ONLY JSON matching:
{
  "directions": [
    {
      "id": "short-slug",
      "title": "Short human title",
      "description": "1-2 sentence conceptual shift focusing on WHAT to change",
      "pillar": "${pillar}",
      "confidence": "low | medium | high"
    }
  ]
}

Rules:
- Each description must explain the conceptual change and outcome.
- Do NOT mention implementation details or tactical execution.
- IDs must be kebab-case, unique within this list, and reference the pillar.`;

  return { systemPrompt, userPrompt };
}

export async function improveIdea(options: ImproveIdeaOptions): Promise<IdeaImprovementResult> {
  const basePillars = buildPillarSnapshots(options.currentFeedback.scores);
  const fallback = detectWeakestPillar(basePillars);
  const targetPillarName = options.targetPillar ?? fallback?.pillar;

  if (!targetPillarName) {
    throw new Error('Unable to determine target pillar for improvement');
  }

  const targetSnapshot =
    basePillars.find((pillar) => pillar.pillar === targetPillarName) ??
    fallback ??
    ({
      pillar: targetPillarName,
      label: IDEATE_PILLAR_LABELS[targetPillarName] ?? targetPillarName,
      weight: 1,
      score: 50,
      rationale: 'No rationale provided.',
    } as PillarResult);

  const sections = getSectionsForPillar(targetPillarName);
  const directions =
    options.directions && options.directions.length
      ? options.directions
      : await generateImprovementDirections({
          overview: options.overview,
          pillar: targetPillarName,
          weaknessSummary: targetSnapshot.rationale,
        });
  const prompts = buildImprovementPrompt(options.overview, targetSnapshot, sections);

  const { data } = await callJsonPrompt<unknown>({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    temperature: 0.35,
    timeoutMs: 60000,
  });

  if (!data || typeof data !== 'object') {
    throw new Error('AI refinement returned invalid or empty response');
  }

  const parsed = improvementSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error);
    throw new Error('AI refinement response failed validation');
  }

  const normalizedOverview = normalizeOverview(options.overview, parsed.data.improvedOverview);
  let differences = buildSectionDiffs(options.overview, normalizedOverview, sections);

  if (!differences.length) {
    differences = parsed.data.rewrittenSections.map((entry) => ({
      section: entry.section,
      before: formatOverviewSection(options.overview, sections[0]),
      after: entry.after,
    }));
  }

  const primaryDiff = differences[0] ?? {
    section: SECTION_TITLES[sections[0]] ?? sections[0],
    before: formatOverviewSection(options.overview, sections[0]),
    after: formatOverviewSection(normalizedOverview, sections[0]),
  };

  const updatedFeedback = await runIdeateInitialFeedback(
    options.feedbackInput,
    serializeOverviewForFeedback(normalizedOverview),
  );
  const updatedPillars = buildPillarSnapshots(updatedFeedback.scores);

  const prevScore = targetSnapshot.score ?? 0;
  const newScore =
    updatedPillars.find((pillar) => pillar.pillar === targetPillarName)?.score ?? prevScore;
  const scoreDelta = newScore - prevScore;

  return {
    improvedOverview: normalizedOverview,
    differences,
    pillarImpacted: (parsed.data.pillarImpacted as PillarName) || targetPillarName,
    scoreDelta,
    beforeSection: primaryDiff.before,
    afterSection: primaryDiff.after,
    updatedPillars,
    feedback: updatedFeedback,
    directions,
    selectedDirectionId: options.selectedDirectionId,
    selectedDirection: options.selectedDirectionId
      ? directions.find((direction) => direction.id === options.selectedDirectionId) ?? null
      : null,
  };
}

export async function autoImproveIdea(options: AutoImproveOptions): Promise<AutoImproveResult> {
  const targetScore = options.targetScore ?? 90;
  const maxIterations = options.maxIterations ?? MAX_ITERATIONS;

  let workingOverview = options.overview;
  let workingFeedback = options.currentFeedback;
  const iterations: IdeaImprovementResult[] = [];

  for (let i = 0; i < maxIterations; i += 1) {
    const pillars = buildPillarSnapshots(workingFeedback.scores);
    const weakest = detectWeakestPillar(pillars);
    if (!weakest || weakest.score >= targetScore) {
      break;
    }

    const iteration = await improveIdea({
      overview: workingOverview,
      currentFeedback: workingFeedback,
      feedbackInput: options.feedbackInput,
      targetPillar: weakest.pillar,
    });

    iterations.push(iteration);
    workingOverview = iteration.improvedOverview;
    workingFeedback = iteration.feedback;
  }

  const finalPillars = buildPillarSnapshots(workingFeedback.scores);
  const weakestAfter = detectWeakestPillar(finalPillars);
  const reachedTarget = (weakestAfter?.score ?? 0) >= targetScore;

  return {
    finalOverview: workingOverview,
    finalFeedback: workingFeedback,
    pillars: finalPillars,
    iterations,
    reachedTarget,
  };
}

export async function generateImprovementDirections(
  options: GenerateImprovementDirectionsOptions,
): Promise<ImprovementDirection[]> {
  const sections = getSectionsForPillar(options.pillar);
  const prompts = buildDirectionPrompt(
    options.overview,
    options.pillar,
    options.weaknessSummary,
    sections,
  );

  const directionSchema = z.object({
    directions: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(3),
          description: z.string().min(10),
          pillar: z.literal(options.pillar),
          confidence: z.enum(['low', 'medium', 'high']),
        }),
      )
      .min(2)
      .max(3),
  });

  const { data } = await callJsonPrompt<unknown>({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    temperature: 0.4,
    timeoutMs: 60000,
  });

  if (!data || typeof data !== 'object') {
    throw new Error('AI improvement directions returned invalid response');
  }

  const parsed = directionSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Schema validation failed (directions):', parsed.error);
    throw new Error('AI improvement directions response failed validation');
  }

  return parsed.data.directions.map(
    (direction): ImprovementDirection => ({
      id: direction.id,
      title: direction.title,
      description: direction.description,
      pillar: direction.pillar,
      confidence: direction.confidence,
    }),
  );
}
