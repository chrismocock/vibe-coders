import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = new URL(req.url).searchParams.get('id');
    if (!reportId) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Get report
    const { data: report, error } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      console.error('Error fetching validation report:', error);
      return NextResponse.json(
        { error: error?.message || 'Report not found' },
        { status: 500 }
      );
    }

    // Verify ownership through project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', report.project_id)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

