import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  generateProductOverview,
  ValidationAIError,
  ValidationAIErrorKind,
} from '@/server/validation/productOverview';
import { ValidationPillarResult } from '@/server/validation/types';

interface ImproveRequestBody {
  projectId: string;
  idea: {
    title: string;
    summary: string;
    context?: string;
  };
  pillars: ValidationPillarResult[];
}

const VALIDATION_ERROR_STATUS: Record<ValidationAIErrorKind, number> = {
  input: 400,
  config: 500,
  timeout: 504,
  provider: 502,
  schema: 502,
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ImproveRequestBody;
    if (!body?.projectId || !body.idea || !Array.isArray(body.pillars)) {
      return NextResponse.json(
        { error: 'projectId, idea, and pillars are required' },
        { status: 400 },
      );
    }

    const sanitizedIdea = {
      title: body.idea.title?.trim() || '',
      summary: body.idea.summary?.trim() || '',
      context: body.idea.context?.trim() || undefined,
    };

    if (!sanitizedIdea.title) {
      return NextResponse.json({ error: 'Idea title is required' }, { status: 400 });
    }

    if (!sanitizedIdea.summary) {
      return NextResponse.json({ error: 'Idea summary is required' }, { status: 400 });
    }

    if (body.pillars.length === 0) {
      return NextResponse.json({ error: 'pillars array cannot be empty' }, { status: 400 });
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

    try {
      const overview = await generateProductOverview({
        title: sanitizedIdea.title,
        summary: sanitizedIdea.summary,
        context: sanitizedIdea.context,
        pillars: body.pillars,
      });

      return NextResponse.json({
        pillars: body.pillars,
        aiProductOverview: overview,
      });
    } catch (error) {
      if (error instanceof ValidationAIError) {
        return NextResponse.json(
          {
            error: error.message,
            meta: {
              kind: error.kind,
              ...(error as Error & { meta?: Record<string, unknown> }).meta,
            },
          },
          { status: VALIDATION_ERROR_STATUS[error.kind] },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to generate AI Product Overview:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI Product Overview' },
      { status: 500 },
    );
  }
}


