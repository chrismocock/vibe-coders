import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = new URL(req.url).searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    const { data: validatedIdea, error } = await supabase
      .from('validated_ideas')
      .select('id, ai_overview')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load validated idea overview:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch validated idea overview' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      overview: validatedIdea?.ai_overview ?? null,
      validatedIdeaId: validatedIdea?.id ?? null,
    });
  } catch (err) {
    console.error('Overview fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
