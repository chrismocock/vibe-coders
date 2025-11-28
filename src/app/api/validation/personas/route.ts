import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runPersonaModelsAgent } from '@/server/validation/agents';
import { updateReportPersonas } from '@/server/validation/store';
import {
  formatFeatureMap,
  formatIdeaEnhancement,
  formatOpportunityScore,
  formatRiskRadar,
  formatScoresForPrompt,
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

    const supportingInsights = [
      formatScoresForPrompt(context.report),
      formatFeatureMap(context.report.featureMap),
      formatIdeaEnhancement(context.report.ideaEnhancement),
      formatOpportunityScore(context.report.opportunityScore),
      formatRiskRadar(context.report.riskRadar),
    ]
      .filter(Boolean)
      .join('\n\n');

    const personas = await runPersonaModelsAgent({
      title: context.ideaTitle,
      summary: context.ideaSummary,
      aiReview: supportingInsights,
    });

    await updateReportPersonas(context.reportId, personas);

    return NextResponse.json({
      reportId: context.reportId,
      personas,
    });
  } catch (error) {
    console.error('Validation personas error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate personas' },
      { status: 500 }
    );
  }
}

