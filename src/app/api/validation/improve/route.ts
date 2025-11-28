import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runIdeaEnhancerAgent } from '@/server/validation/agents';
import { updateIdeaEnhancement } from '@/server/validation/store';
import {
  formatFeatureMap,
  formatPersonas,
  formatScoresForPrompt,
  formatRiskRadar,
  formatOpportunityScore,
} from '@/server/validation/formatters';

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

    const enhancement = await runIdeaEnhancerAgent({
      title: context.ideaTitle,
      summary: context.ideaSummary,
      aiReview: formatScoresForPrompt(context.report),
      personas: formatPersonas(context.report.personas),
      featureMap: formatFeatureMap(context.report.featureMap),
      competitorNotes: formatRiskRadar(context.report.riskRadar),
    });

    await updateIdeaEnhancement(context.reportId, enhancement);

    return NextResponse.json({
      reportId: context.reportId,
      enhancement,
    });
  } catch (error) {
    console.error('Validation idea enhancer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance idea' },
      { status: 500 }
    );
  }
}

