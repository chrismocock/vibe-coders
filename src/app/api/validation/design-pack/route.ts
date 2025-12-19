import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  getValidationReportById,
  rowToValidationReport,
  updateDesignBrief,
} from '@/server/validation/store';
import { runDesignBriefAgent } from '@/server/validation/agents';
import { formatFeatureMap, formatPersonas } from '@/server/validation/formatters';
import { ValidationReport, DesignBrief, DecisionAssumption } from '@/server/validation/types';

interface DesignPack {
  reportId: string;
  generatedAt: string;
  decision: ValidationReport['decisionSpine'] | null;
  overview: {
    recommendation: ValidationReport['recommendation'];
    confidence: number;
    refinedPitch: string | undefined;
    summary: string | undefined;
  };
  coreProblems: string[];
  personas: DesignBrief['personas'];
  featureSet: DesignBrief['featureSet'] | ValidationReport['featureMap'] | null;
  valueProposition: string;
  messaging: string[];
  competitorGaps: string[];
  initialUIIdeas: string[];
  winMoves: string[];
  killRisks: string[];
  assumptions: DecisionAssumption[];
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, reportId } = await req.json();

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
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 },
      );
    }

    const reportRow = await resolveReport(projectId, reportId);
    if (!reportRow) {
      return NextResponse.json({ error: 'Validation report not found' }, { status: 404 });
    }
    if (reportRow.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Latest report is still running. Try again shortly.' },
        { status: 409 },
      );
    }

    let normalized = rowToValidationReport(reportRow);

    if (!normalized.designBrief) {
      const generatedBrief = await ensureDesignBrief(reportRow.id, normalized);
      normalized = {
        ...normalized,
        designBrief: generatedBrief,
      };
    }

    const designPack = buildDesignPack(reportRow.id, normalized);
    await Promise.all([
      saveDesignPack(supabase, projectId, userId, designPack),
      seedDesignStage(supabase, projectId, userId, designPack),
    ]);

    return NextResponse.json({ designPack });
  } catch (error) {
    console.error('Design pack error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create design pack' },
      { status: 500 },
    );
  }
}

async function resolveReport(projectId: string, reportId?: string | null) {
  if (reportId) {
    const report = await getValidationReportById(reportId);
    return report && report.project_id === projectId ? report : null;
  }

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from('validation_reports')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function ensureDesignBrief(
  reportId: string,
  report: ValidationReport,
): Promise<DesignBrief> {
  const personasText = report.personas ? formatPersonas(report.personas) : undefined;
  const featureText = report.featureMap ? formatFeatureMap(report.featureMap) : undefined;
  const opportunitySummary = report.opportunityScore
    ? `Score: ${report.opportunityScore.score}
Momentum: ${report.opportunityScore.breakdown.marketMomentum}
Audience: ${report.opportunityScore.breakdown.audienceEnthusiasm}`
    : undefined;
  const riskSummary = report.riskRadar
    ? `Market: ${report.riskRadar.market}, Competition: ${report.riskRadar.competition}, Technical: ${report.riskRadar.technical}`
    : undefined;
  const enhancementSummary = report.ideaEnhancement
    ? `Positioning: ${report.ideaEnhancement.strongerPositioning}
Unique: ${report.ideaEnhancement.uniqueAngle}
Why It Wins: ${report.ideaEnhancement.whyItWins}`
    : undefined;

  const generatedBrief = await runDesignBriefAgent({
    title: report.ideaTitle,
    summary: report.ideaSummary,
    personas: personasText,
    featureMap: featureText,
    opportunityScore: opportunitySummary,
    riskRadar: riskSummary,
    ideaEnhancement: enhancementSummary,
  });

  await updateDesignBrief(reportId, generatedBrief);
  return generatedBrief;
}

function buildDesignPack(reportId: string, report: ValidationReport): DesignPack {
  const brief = report.designBrief as DesignBrief | null;
  const decision = report.decisionSpine || null;
  const refinedPitch =
    report.ideaEnhancement?.strongerPositioning || report.ideaEnhancement?.uniqueAngle;
  const winMoves =
    decision?.winMoves ||
    report.ideaEnhancement?.differentiators ||
    report.featureMap?.must ||
    [];

  return {
    reportId,
    generatedAt: new Date().toISOString(),
    decision,
    overview: {
      recommendation: report.recommendation,
      confidence: decision?.confidence ?? report.overallConfidence ?? 0,
      refinedPitch,
      summary: report.ideaSummary,
    },
    coreProblems: brief?.coreProblems || [],
    personas: brief?.personas || report.personas || [],
    featureSet: brief?.featureSet || report.featureMap || null,
    valueProposition: brief?.valueProposition || report.ideaEnhancement?.whyItWins || '',
    messaging: brief?.messaging || [],
    competitorGaps: brief?.competitorGaps || [],
    initialUIIdeas: brief?.initialUIIdeas || [],
    winMoves,
    killRisks: decision?.killRisks || [],
    assumptions: decision?.assumptions || [],
  };
}

async function saveDesignPack(
  supabase: ReturnType<typeof getSupabaseServer>,
  projectId: string,
  userId: string,
  designPack: DesignPack,
) {
  const { data: existing } = await supabase
    .from('design_blueprints')
    .select('id, design_summary')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  const currentSummary =
    (existing?.design_summary &&
      (typeof existing.design_summary === 'string'
        ? JSON.parse(existing.design_summary)
        : existing.design_summary)) ||
    {};

  const summaryPayload = {
    ...currentSummary,
    designPack,
    seededFromReport: designPack.reportId,
  };

  if (existing) {
    await supabase
      .from('design_blueprints')
      .update({
        design_summary: summaryPayload,
        last_ai_run: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('design_blueprints').insert({
      project_id: projectId,
      user_id: userId,
      design_summary: summaryPayload,
      section_completion: {},
      last_ai_run: new Date().toISOString(),
    });
  }
}

async function seedDesignStage(
  supabase: ReturnType<typeof getSupabaseServer>,
  projectId: string,
  userId: string,
  designPack: DesignPack,
) {
  const { data: existingStage } = await supabase
    .from('project_stages')
    .select('id,input,status')
    .eq('project_id', projectId)
    .eq('stage', 'design')
    .eq('user_id', userId)
    .maybeSingle();

  const packInput = {
    designPack,
    reportId: designPack.reportId,
  };

  if (existingStage) {
    let parsedInput: Record<string, unknown> = {};
    if (existingStage.input) {
      try {
        parsedInput =
          typeof existingStage.input === 'string'
            ? JSON.parse(existingStage.input)
            : (existingStage.input as Record<string, unknown>);
      } catch {
        parsedInput = {};
      }
    }

    await supabase
      .from('project_stages')
      .update({
        input: JSON.stringify({ ...parsedInput, designPack: packInput.designPack, reportId: designPack.reportId }),
        status: existingStage.status === 'completed' ? existingStage.status : 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingStage.id);
  } else {
    await supabase.from('project_stages').insert({
      project_id: projectId,
      user_id: userId,
      stage: 'design',
      input: JSON.stringify(packInput),
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
