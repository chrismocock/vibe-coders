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
  overview: AIProductOverview;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as SaveRequestBody;
    if (!body?.projectId || !Array.isArray(body.pillars) || !body.overview) {
      return NextResponse.json(
        { error: 'projectId, pillars, and overview are required' },
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

    const { data: savedIdea, error: upsertError } = await supabase
      .from('validated_ideas')
      .upsert(
        {
          user_id: userId,
          project_id: body.projectId,
          idea_id: ideateStage.id,
          pillar_scores: body.pillars,
          ai_overview: body.overview,
        },
        { onConflict: 'project_id' },
      )
      .select()
      .single();

    if (upsertError || !savedIdea) {
      console.error('Failed to save validated idea:', upsertError);
      return NextResponse.json({ error: 'Failed to save validated idea' }, { status: 500 });
    }

    const stageInput = {
      validatedIdeaId: savedIdea.id,
      idea: ideaSnapshot,
      pillarScores: body.pillars,
    };

    const stageOutput = {
      overview: body.overview,
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
      }
    }

    return NextResponse.json({
      validatedIdea: savedIdea,
    });
  } catch (error) {
    console.error('Failed to save validation overview:', error);
    return NextResponse.json(
      { error: 'Failed to save validation overview' },
      { status: 500 },
    );
  }
}


