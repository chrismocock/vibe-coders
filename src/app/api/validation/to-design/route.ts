import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runDesignBriefAgent } from '@/server/validation/agents';
import { updateDesignBrief } from '@/server/validation/store';
import {
  formatFeatureMap,
  formatIdeaEnhancement,
  formatOpportunityScore,
  formatPersonas,
  formatRiskRadar,
  formatScoresForPrompt,
} from '@/server/validation/formatters';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, reportId } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const context = await resolveValidationReportContext(userId, projectId, reportId);
    const designBrief = await runDesignBriefAgent({
      title: context.ideaTitle,
      summary: context.ideaSummary,
      personas: formatPersonas(context.report.personas),
      featureMap: formatFeatureMap(context.report.featureMap),
      opportunityScore: formatOpportunityScore(context.report.opportunityScore),
      riskRadar: formatRiskRadar(context.report.riskRadar),
      ideaEnhancement: formatIdeaEnhancement(context.report.ideaEnhancement),
    });

    await updateDesignBrief(context.reportId, designBrief);

    const supabase = getSupabaseServer();
    const stagePayload = {
      designBrief,
      validationReportId: context.reportId,
      opportunityScore: context.report.opportunityScore,
      riskRadar: context.report.riskRadar,
      ideaEnhancement: context.report.ideaEnhancement,
      featureMap: context.report.featureMap,
      personas: context.report.personas,
      scores: formatScoresForPrompt(context.report),
    };

    const inputString = JSON.stringify(stagePayload);

    const { data: existingDesign } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', projectId)
      .eq('stage', 'design')
      .eq('user_id', userId)
      .single();

    if (existingDesign) {
      await supabase
        .from('project_stages')
        .update({
          input: inputString,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDesign.id);
    } else {
      await supabase.from('project_stages').insert({
        project_id: projectId,
        user_id: userId,
        stage: 'design',
        input: inputString,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await supabase.from('design_blueprints').upsert(
      {
        project_id: projectId,
        user_id: userId,
        user_personas: designBrief.personas,
        mvp_definition: {
          coreProblems: designBrief.coreProblems,
          featureSet: designBrief.featureSet,
          initialUIIdeas: designBrief.initialUIIdeas,
        },
        product_blueprint: {
          positioning: designBrief.positioning,
          valueProposition: designBrief.valueProposition,
          pricing: designBrief.pricing,
          competitorGaps: designBrief.competitorGaps,
        },
        design_summary: {
          designBrief,
          opportunityScore: context.report.opportunityScore,
          riskRadar: context.report.riskRadar,
        },
        last_ai_run: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    );

    return NextResponse.json({
      reportId: context.reportId,
      designBrief,
    });
  } catch (error) {
    console.error('Validation to design error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send data to design stage' },
      { status: 500 }
    );
  }
}

