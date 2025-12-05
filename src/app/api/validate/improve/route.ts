import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { generateProductOverview } from '@/server/validation/productOverview';
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ImproveRequestBody;
    if (!body?.projectId || !body.idea?.summary || !Array.isArray(body.pillars)) {
      return NextResponse.json(
        { error: 'projectId, idea, and pillars are required' },
        { status: 400 },
      );
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

    const overview = await generateProductOverview({
      title: body.idea.title || 'Untitled Idea',
      summary: body.idea.summary,
      context: body.idea.context,
      pillars: body.pillars,
    });

    return NextResponse.json({
      pillars: body.pillars,
      aiProductOverview: overview,
    });
  } catch (error) {
    console.error('Failed to generate AI Product Overview:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI Product Overview' },
      { status: 500 },
    );
  }
}


