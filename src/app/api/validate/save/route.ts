import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { AIProductOverview, ValidationPillarResult } from '@/server/validation/types';
import { extractIdeaDetails } from '@/server/validation/idea';

interface SaveRequestBody {
  projectId: string;
  idea?: {
    title?: string;
    summary?: string;
    context?: string;
  };
  pillars: ValidationPillarResult[];
  aiProductOverview: AIProductOverview;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as SaveRequestBody;
    if (!body?.projectId || !Array.isArray(body.pillars) || !body.aiProductOverview) {
      return NextResponse.json(
        { error: 'projectId, pillars, and aiProductOverview are required' },
        { status: 400 },
      );
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
      .select('id,input')
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

    const baseIdea = extractIdeaDetails(ideateStage.input);
    const ideaSnapshot = {
      title: body.idea?.title || baseIdea.title,
      summary: body.idea?.summary || baseIdea.summary,
      context: body.idea?.context || baseIdea.context,
    };

    // Check if a validated_idea already exists for this project (project_id unique constraint)
    const { data: existingByProject } = await supabase
      .from('validated_ideas')
      .select('id, idea_id')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if a validated_idea exists with the same idea_id (idea_id unique constraint)
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
            error: 'Failed to save validated idea',
            details: deleteError.message || 'Conflict resolution failed',
          },
          { status: 500 },
        );
      }
    }

    // Now insert or update based on whether a record exists for this project
    let savedIdea;
    let upsertError;

    if (existingByProject) {
      // Update existing record (project_id match)
      const { data, error } = await supabase
        .from('validated_ideas')
        .update({
          idea_id: ideateStage.id,
          pillar_scores: body.pillars,
          ai_overview: body.aiProductOverview,
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
          pillar_scores: body.pillars,
          ai_overview: body.aiProductOverview,
        })
        .select()
        .single();
      savedIdea = data;
      upsertError = error;
    }

    if (upsertError || !savedIdea) {
      console.error('Failed to save validated idea:', {
        error: upsertError,
        code: upsertError?.code,
        message: upsertError?.message,
        details: upsertError?.details,
      });
      return NextResponse.json(
        {
          error: 'Failed to save validated idea',
          details: upsertError?.message || upsertError?.code || 'Unknown error',
        },
        { status: 500 },
      );
    }

    const stageInput = {
      validatedIdeaId: savedIdea.id,
      idea: ideaSnapshot,
      pillarScores: body.pillars,
    };

    const stageOutput = {
      // Keep legacy field for compatibility with existing consumers
      aiProductOverview: body.aiProductOverview,
      // New field name expected by downstream loaders (e.g., Design workspace)
      overview: body.aiProductOverview,
      validatedIdeaId: savedIdea.id,
    };

    const { data: existingStage } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', body.projectId)
      .eq('user_id', userId)
      .eq('stage', 'validate')
      .maybeSingle();

    if (existingStage) {
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          input: JSON.stringify(stageInput),
          output: JSON.stringify(stageOutput),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStage.id);

      if (updateError) {
        console.error('Failed to update validate stage snapshot:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to save validation stage snapshot',
            details: updateError.message || updateError.code || 'Unknown error',
          },
          { status: 500 },
        );
      }
    } else {
      const { error: insertError } = await supabase.from('project_stages').insert({
        project_id: body.projectId,
        user_id: userId,
        stage: 'validate',
        input: JSON.stringify(stageInput),
        output: JSON.stringify(stageOutput),
        status: 'completed',
      });

      if (insertError) {
        console.error('Failed to insert validate stage snapshot:', insertError);
        return NextResponse.json(
          {
            error: 'Failed to save validation stage snapshot',
            details: insertError.message || insertError.code || 'Unknown error',
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      validatedIdea: savedIdea,
      pillars: body.pillars,
      aiProductOverview: body.aiProductOverview,
    });
  } catch (error) {
    console.error('Failed to save validation overview:', error);
    return NextResponse.json(
      { error: 'Failed to save validation overview' },
      { status: 500 },
    );
  }
}


