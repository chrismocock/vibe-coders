import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { generateValidationPillars } from '@/server/validation/pillars';
import { extractIdeaDetails } from '@/server/validation/idea';

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
      const review =
        (parsed && typeof parsed === 'object' && 'aiReview' in parsed && (parsed as any).aiReview) ||
        (parsed && typeof parsed === 'object' && 'reviewText' in parsed && (parsed as any).reviewText);
      return parseCandidate(review) ?? parseCandidate(rawOutput);
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
      (savedValidatedIdea?.pillar_scores as Awaited<ReturnType<typeof generateValidationPillars>> | null) ??
      (await generateValidationPillars({
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      }));

    return NextResponse.json({
      idea: {
        ideaStageId: ideateStage?.id ?? null,
        title: ideaTitle,
        summary: ideaSummary,
        context: ideaContext,
      },
      pillars,
      overview: savedValidatedIdea?.ai_overview ?? null,
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


