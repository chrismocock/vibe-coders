import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, validatedIdeaId } = body;

    if (!projectId || typeof projectId !== 'string') {
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
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    let validatedQuery = supabase
      .from('validated_ideas')
      .select('id, pillar_scores, ai_overview')
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (validatedIdeaId) {
      validatedQuery = validatedQuery.eq('id', validatedIdeaId);
    }

    const { data: validatedIdea } = await validatedQuery.single();

    if (!validatedIdea?.ai_overview) {
      return NextResponse.json(
        { error: 'AI Product Overview not found. Run validation first.' },
        { status: 400 }
      );
    }

    const overview = validatedIdea.ai_overview;
    const stagePayload = {
      overview,
      pillarScores: validatedIdea.pillar_scores,
      source: 'validated_ideas',
    };

    const { data: existingDesign } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', projectId)
      .eq('stage', 'design')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingDesign) {
      await supabase
        .from('project_stages')
        .update({
          input: JSON.stringify(stagePayload),
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDesign.id);
    } else {
      await supabase.from('project_stages').insert({
        project_id: projectId,
        user_id: userId,
        stage: 'design',
        input: JSON.stringify(stagePayload),
        status: 'in_progress',
      });
    }

    await supabase.from('design_blueprints').upsert(
      {
        project_id: projectId,
        user_id: userId,
        user_personas: overview.personas,
        mvp_definition: {
          refinedPitch: overview.refinedPitch,
          problemSummary: overview.problemSummary,
          coreFeatures: overview.coreFeatures,
          buildNotes: overview.buildNotes,
        },
        product_blueprint: {
          uniqueValue: overview.uniqueValue,
          competition: overview.competition,
          solution: overview.solution,
        },
        design_summary: {
          overview,
          pillarScores: validatedIdea.pillar_scores,
        },
        last_ai_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    );

    return NextResponse.json({
      validatedIdeaId: validatedIdea.id,
      overview,
    });
  } catch (error) {
    console.error('Validation to design error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send data to design stage' },
      { status: 500 }
    );
  }
}

