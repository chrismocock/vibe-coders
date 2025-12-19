import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import type { AIProductOverview } from '@/server/validation/types';
import type { ProductOverview } from '@/server/ideate/refinementEngine';

interface SaveOverviewRequestBody {
  projectId: string;
  productOverview: ProductOverview | AIProductOverview;
}

// Convert ProductOverview to AIProductOverview (they have the same structure, so this is mostly a type cast)
function convertToAIProductOverview(overview: ProductOverview | AIProductOverview): AIProductOverview {
  // ProductOverview and AIProductOverview have the same structure, so we can safely cast
  return overview as AIProductOverview;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as SaveOverviewRequestBody;
    if (!body?.projectId || !body?.productOverview) {
      return NextResponse.json(
        { error: 'projectId and productOverview are required' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    
    // Verify project exists and user has access
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

    // Get the ideate stage for this project
    const { data: ideateStage } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .eq('stage', 'ideate')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ideateStage) {
      return NextResponse.json(
        { error: 'Ideate stage not found. Complete the Ideate stage first.' },
        { status: 400 },
      );
    }

    // Convert ProductOverview to AIProductOverview format
    const aiProductOverview = convertToAIProductOverview(body.productOverview);

    // Check if a validated_idea already exists for this project
    const { data: existingByProject } = await supabase
      .from('validated_ideas')
      .select('id, idea_id')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if a validated_idea exists with the same idea_id
    const { data: existingByIdea } = await supabase
      .from('validated_ideas')
      .select('id, project_id')
      .eq('idea_id', ideateStage.id)
      .eq('user_id', userId)
      .maybeSingle();

    // Handle conflicts: both project_id and idea_id have unique constraints
    // Priority: project_id takes precedence (one validated idea per project)
    if (existingByIdea && existingByIdea.id !== existingByProject?.id) {
      // Delete the record that conflicts on idea_id (unless it's the same as project record)
      const { error: deleteError } = await supabase
        .from('validated_ideas')
        .delete()
        .eq('id', existingByIdea.id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Failed to delete conflicting validated idea:', deleteError);
        return NextResponse.json(
          {
            error: 'Failed to save overview due to database conflict',
            details: deleteError.message || deleteError.code || 'Unknown error',
          },
          { status: 500 },
        );
      }
    }

    let savedIdea;
    let upsertError;

    if (existingByProject) {
      // Update existing record (project_id match)
      const { data, error } = await supabase
        .from('validated_ideas')
        .update({
          idea_id: ideateStage.id,
          ai_overview: aiProductOverview,
          pillar_scores: [], // Empty array, will be populated by validation stage
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByProject.id)
        .eq('user_id', userId)
        .select()
        .single();
      savedIdea = data;
      upsertError = error;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('validated_ideas')
        .insert({
          user_id: userId,
          project_id: body.projectId,
          idea_id: ideateStage.id,
          ai_overview: aiProductOverview,
          pillar_scores: [], // Empty array, will be populated by validation stage
        })
        .select()
        .single();
      savedIdea = data;
      upsertError = error;
    }

    if (upsertError || !savedIdea) {
      console.error('Failed to save product overview:', {
        error: upsertError,
        code: upsertError?.code,
        message: upsertError?.message,
        details: upsertError?.details,
      });
      return NextResponse.json(
        {
          error: 'Failed to save product overview',
          details: upsertError?.message || upsertError?.code || 'Unknown error',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      validatedIdeaId: savedIdea.id,
      message: 'Product overview saved successfully',
    });
  } catch (error) {
    console.error('Error saving product overview:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

