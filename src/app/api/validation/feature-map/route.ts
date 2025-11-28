import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runFeatureOpportunityMapAgent } from '@/server/validation/agents';
import { updateFeatureMap } from '@/server/validation/store';
import {
  formatPersonas,
  formatScoresForPrompt,
  formatOpportunityScore,
  formatRiskRadar,
  formatIdeaEnhancement,
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

    const personasText = formatPersonas(context.report.personas);
    const signals = [
      formatScoresForPrompt(context.report),
      formatOpportunityScore(context.report.opportunityScore),
      formatRiskRadar(context.report.riskRadar),
      formatIdeaEnhancement(context.report.ideaEnhancement),
    ]
      .filter(Boolean)
      .join('\n\n');

    const featureMap = await runFeatureOpportunityMapAgent({
      title: context.ideaTitle,
      summary: context.ideaSummary,
      personas: personasText,
      insights: signals,
    });

    await updateFeatureMap(context.reportId, featureMap);

    return NextResponse.json({
      reportId: context.reportId,
      featureMap,
    });
  } catch (error) {
    console.error('Validation feature map error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate feature map' },
      { status: 500 }
    );
  }
}

