import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

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
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Invoke Supabase Edge Function to run validation
    console.log('Invoking swift-handler function with:', { projectId, ideaTitle: idea.title });
    
    const { data, error } = await supabase.functions.invoke('swift-handler', {
      body: { projectId, idea },
    });

    console.log('Function response:', { data, error });

    if (error) {
      console.error('Error invoking validate function:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message || JSON.stringify(error) || 'Failed to start validation. Check function logs in Supabase Dashboard.' },
        { status: 500 }
      );
    }

    // Check if response contains error
    if (data && typeof data === 'object' && 'error' in data) {
      console.error('Function returned error in response:', data.error);
      return NextResponse.json(
        { error: data.error || 'Validation function returned an error' },
        { status: 500 }
      );
    }

    if (!data?.reportId) {
      console.error('No reportId in response:', data);
      return NextResponse.json(
        { error: 'Invalid response from validation function. Expected reportId.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reportId: data.reportId });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

