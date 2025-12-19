import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { generatePillars } from '@/server/validation/pillars';
import { JsonPromptError } from '@/server/validation/openai';
import { extractIdeaDetails, ideaDetailsFromOverview } from '@/server/validation/idea';
import {
  AIProductMonetisationOption,
  AIProductOverview,
  AIProductPersona,
  AIProductRisk,
  ValidationPillarResult,
} from '@/server/validation/types';
import { VALIDATION_PILLAR_DEFINITIONS, ValidationPillarDefinition } from '@/lib/ai/prompts/validation/pillars';

type StageSnapshot = {
  input?: unknown;
  output?: unknown;
};
function normalizeOverview(overview: unknown): AIProductOverview | null {
  if (!overview || typeof overview !== 'object') {
    return null;
  }

  const cast = overview as Partial<AIProductOverview>;
  const sanitizeString = (value: unknown, fallback = '') => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : fallback;
    }
    return fallback;
  };
  const sanitizeOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };
  const sanitizeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
  const sanitizeStringArray = (value: unknown): string[] =>
    sanitizeArray<unknown>(value)
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  const sanitizeMonetisationOption = (
    option?: Partial<AIProductMonetisationOption>,
  ): AIProductMonetisationOption => ({
    model: sanitizeString(option?.model),
    description: sanitizeString(option?.description),
    pricingNotes: sanitizeOptionalString(option?.pricingNotes),
  });
  const sanitizeRisk = (risk?: Partial<AIProductRisk>): AIProductRisk => ({
    risk: sanitizeString(risk?.risk),
    mitigation: sanitizeString(risk?.mitigation),
  });
  const sanitizePersona = (persona?: Partial<AIProductPersona>): AIProductPersona => ({
    name: sanitizeString(persona?.name),
    role: sanitizeOptionalString(persona?.role),
    summary: sanitizeString(persona?.summary),
    needs: sanitizeStringArray(persona?.needs),
    motivations: sanitizeStringArray(persona?.motivations),
    painPoints: sanitizeStringArray(persona?.painPoints),
  });

  return {
    refinedPitch: sanitizeString(cast.refinedPitch),
    problemSummary: sanitizeString(cast.problemSummary),
    solution: sanitizeString(cast.solution),
    coreFeatures: sanitizeStringArray(cast.coreFeatures),
    uniqueValue: sanitizeString(cast.uniqueValue),
    competition: sanitizeString(cast.competition),
    marketSize: sanitizeString(cast.marketSize ?? 'Add market sizing details.'),
    buildNotes: sanitizeString(cast.buildNotes),
    monetisation: sanitizeArray<Partial<AIProductMonetisationOption>>(cast.monetisation).map(
      sanitizeMonetisationOption,
    ),
    risks: sanitizeArray<Partial<AIProductRisk>>(cast.risks).map(sanitizeRisk),
    personas: sanitizeArray<Partial<AIProductPersona>>(cast.personas).map(sanitizePersona),
  };
}

interface PillarRequestBody {
  projectId: string;
  idea?: {
    title?: string;
    summary?: string;
    context?: string;
  };
}

function extractAiReview(rawOutput?: unknown): string | undefined {
  if (!rawOutput) return undefined;

  const parseCandidate = (candidate: unknown): string | undefined => {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    return undefined;
  };

  if (typeof rawOutput === 'string') {
    try {
      const parsed = JSON.parse(rawOutput);
      if (parsed && typeof parsed === 'object') {
        const parsedRecord = parsed as Record<string, unknown>;
        const reviewCandidate =
          parseCandidate(parsedRecord.aiReview) ?? parseCandidate(parsedRecord.reviewText);
        if (reviewCandidate) {
          return reviewCandidate;
        }
      }
      return parseCandidate(rawOutput);
    } catch {
      return rawOutput.trim();
    }
  }

  if (typeof rawOutput === 'object' && rawOutput !== null) {
    const review = (rawOutput as Record<string, unknown>).aiReview ?? (rawOutput as Record<string, unknown>).reviewText;
    return parseCandidate(review);
  }

  return undefined;
}

const PILLAR_ERROR_STATUS: Record<JsonPromptError['kind'], number> = {
  config: 500,
  timeout: 504,
  bad_response: 502,
  openai: 502,
};

const PILLAR_ERROR_MESSAGE: Record<JsonPromptError['kind'], string> = {
  config: 'OpenAI API key is missing or invalid. Check project settings.',
  timeout: 'The validation request timed out. Please try again shortly.',
  bad_response: 'OpenAI returned an unexpected response. Please retry.',
  openai: 'OpenAI request failed. Please try again.',
};

function parseStageSnapshot(snapshot?: StageSnapshot | null) {
  if (!snapshot) return {};

  const parseJson = (value?: unknown) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return undefined;
  };

  const input = parseJson(snapshot.input) ?? {};
  const output = parseJson(snapshot.output) ?? {};

  const idea = (input as { idea?: unknown }).idea as
    | { title?: string; summary?: string; context?: string }
    | undefined;
  const pillarScores = (input as { pillarScores?: unknown }).pillarScores as ValidationPillarResult[] | undefined;
  const overview =
    (output as { overview?: unknown }).overview ?? (output as { aiProductOverview?: unknown }).aiProductOverview;
  const validatedIdeaId =
    (output as { validatedIdeaId?: unknown }).validatedIdeaId ?? (input as { validatedIdeaId?: unknown }).validatedIdeaId;

  return { idea, pillarScores, overview, validatedIdeaId };
}

function hasCompletePillarCoverage(pillars?: unknown, definitions: ValidationPillarDefinition[] = VALIDATION_PILLAR_DEFINITIONS): pillars is ValidationPillarResult[] {
  if (!Array.isArray(pillars) || definitions.length === 0) return false;

  const expectedIds = new Set(definitions.map((definition) => definition.id));

  if (pillars.length !== expectedIds.size) return false;

  const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

  for (const pillar of pillars as ValidationPillarResult[]) {
    if (!pillar || typeof pillar !== 'object') return false;

    if (!expectedIds.has(pillar.pillarId)) return false;

    if (
      !hasText(pillar.analysis) ||
      !hasText(pillar.strength) ||
      !hasText(pillar.weakness) ||
      !hasText(pillar.improvementSuggestion)
    ) {
      return false;
    }

    expectedIds.delete(pillar.pillarId);
  }

  return expectedIds.size === 0;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as PillarRequestBody;
    if (!body?.projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 },
      );
    }

    const { data: ideateStage } = await supabase
      .from('project_stages')
      .select('id,input,output')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .eq('stage', 'ideate')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestValidateStage } = await supabase
      .from('project_stages')
      .select('id,input,output')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .eq('stage', 'validate')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { idea: stagedIdea, pillarScores, overview: stagedOverview, validatedIdeaId: stagedValidatedIdeaId } =
      parseStageSnapshot(latestValidateStage);

    const derivedIdea = extractIdeaDetails(ideateStage?.input);
    const aiReviewSummary = extractAiReview(ideateStage?.output);

    let ideaTitle = body.idea?.title?.trim() || stagedIdea?.title || derivedIdea.title;
    let ideaSummary =
      body.idea?.summary?.trim() || aiReviewSummary || stagedIdea?.summary || derivedIdea.summary;
    let ideaContext = body.idea?.context ?? stagedIdea?.context ?? derivedIdea.context;

    if (!ideaSummary || ideaSummary.trim().length === 0) {
      return NextResponse.json(
        { error: 'No idea summary found. Complete the Ideate stage first.' },
        { status: 400 },
      );
    }

    const { data: savedValidatedIdea } = await supabase
      .from('validated_ideas')
      .select('id,pillar_scores,ai_overview')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .maybeSingle();

    const hasCompleteStagedPillars = hasCompletePillarCoverage(pillarScores);
    const hasCompleteSavedPillars = hasCompletePillarCoverage(savedValidatedIdea?.pillar_scores);

    const pillars = hasCompleteStagedPillars
      ? (pillarScores as ValidationPillarResult[])
      : hasCompleteSavedPillars
        ? (savedValidatedIdea?.pillar_scores as ValidationPillarResult[])
        : await generatePillars({
            title: ideaTitle,
            summary: ideaSummary,
            context: ideaContext,
          });

    const normalizedPillars: ValidationPillarResult[] = pillars.map((pillar) => ({
      ...pillar,
      analysis: pillar.analysis ?? `No analysis provided for ${pillar.pillarName}.`,
    }));

    const aiProductOverview =
      normalizeOverview(stagedOverview) ?? normalizeOverview(savedValidatedIdea?.ai_overview ?? null);

    const overviewIdeaDetails = ideaDetailsFromOverview(aiProductOverview);
    if (overviewIdeaDetails) {
      ideaTitle = overviewIdeaDetails.title;
      ideaSummary = overviewIdeaDetails.summary;
      ideaContext = overviewIdeaDetails.context;
    }

    const shouldPersistPillars = !hasCompleteStagedPillars && !hasCompleteSavedPillars;

    let validatedIdeaId = stagedValidatedIdeaId ?? savedValidatedIdea?.id ?? null;

    if (shouldPersistPillars) {
      const overviewPayload = aiProductOverview ?? {};
      const ideaSnapshot = {
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      };

      if (ideateStage?.id) {
        const { data: persistedValidatedIdea, error: persistError } = savedValidatedIdea
          ? await supabase
              .from('validated_ideas')
              .update({
                idea_id: ideateStage.id,
                pillar_scores: normalizedPillars,
                ai_overview: overviewPayload,
                updated_at: new Date().toISOString(),
              })
              .eq('id', savedValidatedIdea.id)
              .eq('user_id', userId)
              .select('id')
              .single()
          : await supabase
              .from('validated_ideas')
              .insert({
                user_id: userId,
                project_id: body.projectId,
                idea_id: ideateStage.id,
                pillar_scores: normalizedPillars,
                ai_overview: overviewPayload,
              })
              .select('id')
              .single();

        if (persistError) {
          console.error('Failed to persist generated pillars to validated_ideas:', persistError);
        } else if (persistedValidatedIdea?.id) {
          validatedIdeaId = persistedValidatedIdea.id;
        }
      }

      const stageInput = { validatedIdeaId, idea: ideaSnapshot, pillarScores: normalizedPillars };
      const stageOutput = {
        aiProductOverview: overviewPayload,
        overview: overviewPayload,
        validatedIdeaId,
      };

      if (latestValidateStage?.id) {
        const { error: updateStageError } = await supabase
          .from('project_stages')
          .update({
            input: JSON.stringify(stageInput),
            output: JSON.stringify(stageOutput),
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestValidateStage.id)
          .eq('user_id', userId);

        if (updateStageError) {
          console.error('Failed to update validate stage snapshot after pillar generation:', updateStageError);
        }
      } else {
        const { error: insertStageError } = await supabase.from('project_stages').insert({
          project_id: body.projectId,
          user_id: userId,
          stage: 'validate',
          input: JSON.stringify(stageInput),
          output: JSON.stringify(stageOutput),
          status: 'completed',
        });

        if (insertStageError) {
          console.error('Failed to insert validate stage snapshot after pillar generation:', insertStageError);
        }
      }
    }

    return NextResponse.json({
      idea: {
        ideaStageId: ideateStage?.id ?? null,
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      },
      pillars: normalizedPillars,
      aiProductOverview,
      validatedIdeaId,
    });
  } catch (error) {
    console.error('Failed to generate validation pillars:', error);

    const sanitizeDetail = (detail?: unknown): string | undefined => {
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
      if (detail instanceof Error && detail.message.trim()) {
        return detail.message.trim();
      }
      if (detail && typeof detail === 'object' && 'message' in detail) {
        const message = (detail as Record<string, unknown>).message;
        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }
      }
      return undefined;
    };

    if (error instanceof JsonPromptError) {
      const kind = error.kind;
      const status = PILLAR_ERROR_STATUS[kind] ?? 500;
      const errorMessage = PILLAR_ERROR_MESSAGE[kind] ?? 'Failed to generate validation pillars';

      const detail = sanitizeDetail(error.message) ?? sanitizeDetail((error as Error & { cause?: unknown }).cause);

      return NextResponse.json({ error: errorMessage, meta: { kind, detail } }, { status });
    }

    return NextResponse.json(
      {
        error: 'Failed to generate validation pillars',
        meta: {
          kind: 'unknown',
          detail: sanitizeDetail((error as Error & { cause?: unknown }).cause) ?? sanitizeDetail(error),
        },
      },
      { status: 500 },
    );
  }
}


