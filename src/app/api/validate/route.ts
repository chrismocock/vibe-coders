import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { StartValidationRunError, startValidationRun } from '@/server/validation/startValidationRun';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = new URL(req.url).searchParams.get('projectId');
    const latest = new URL(req.url).searchParams.get('latest') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // First verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }
    
    let query = supabase
      .from('validation_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (latest) {
      query = query.limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching validation reports:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (latest) {
      return NextResponse.json({ report: data?.[0] || null });
    }

    return NextResponse.json({ reports: data || [] });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, idea } = await req.json();

    if (!projectId || !idea?.title) {
      return NextResponse.json(
        { error: 'projectId and idea.title are required' },
        { status: 400 },
      );
    }

    try {
      const reportId = await startValidationRun({
        projectId,
        userId,
        idea,
      });
      return NextResponse.json({ reportId });
    } catch (error) {
      if (error instanceof StartValidationRunError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error('Failed to start validation run:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to start validation run' },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

