import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { toggleActionCompletion } from '@/server/validation/store';
import { ValidationSection } from '@/server/validation/types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, section, actionText, completed } = await req.json();

    if (!reportId || !section || !actionText || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'reportId, section, actionText, and completed are required' },
        { status: 400 }
      );
    }

    // Validate section name
    const validSections: ValidationSection[] = [
      'problem',
      'market',
      'competition',
      'audience',
      'feasibility',
      'pricing',
      'go-to-market',
    ];

    if (!validSections.includes(section as ValidationSection)) {
      return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Verify report ownership through project
    const { data: report, error: reportError } = await supabase
      .from('validation_reports')
      .select('project_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', report.project_id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    // Toggle action completion
    try {
      await toggleActionCompletion(
        reportId,
        section as ValidationSection,
        actionText,
        completed
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error toggling action completion:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to toggle action completion' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

