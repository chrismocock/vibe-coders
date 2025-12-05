import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { generatePillars } from '@/server/validation/pillars';
import { extractIdeaDetails } from '@/server/validation/idea';
import {
  AIProductMonetisationOption,
  AIProductOverview,
  AIProductPersona,
  AIProductRisk,
  ValidationPillarResult,
} from '@/server/validation/types';
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

    const derivedIdea = extractIdeaDetails(ideateStage?.input);
    const aiReviewSummary = extractAiReview(ideateStage?.output);

    const ideaTitle = body.idea?.title?.trim() || derivedIdea.title;
    const ideaSummary = body.idea?.summary?.trim() || aiReviewSummary || derivedIdea.summary;
    const ideaContext = body.idea?.context ?? derivedIdea.context;

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
      .maybeSingle();

    const pillars =
      (savedValidatedIdea?.pillar_scores as Awaited<ReturnType<typeof generatePillars>> | null) ??
      (await generatePillars({
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      }));

    const normalizedPillars: ValidationPillarResult[] = pillars.map((pillar) => ({
      ...pillar,
      analysis: pillar.analysis ?? `No analysis provided for ${pillar.pillarName}.`,
    }));

    const aiProductOverview = normalizeOverview(savedValidatedIdea?.ai_overview ?? null);

    return NextResponse.json({
      idea: {
        ideaStageId: ideateStage?.id ?? null,
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      },
      pillars: normalizedPillars,
      aiProductOverview,
      validatedIdeaId: savedValidatedIdea?.id ?? null,
    });
  } catch (error) {
    console.error('Failed to generate validation pillars:', error);
    return NextResponse.json(
      { error: 'Failed to generate validation pillars' },
      { status: 500 },
    );
  }
}


