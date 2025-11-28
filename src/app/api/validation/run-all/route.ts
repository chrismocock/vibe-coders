import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import {
  clearSectionActions,
  updateSectionResult,
  calculateOverview,
} from '@/server/validation/store';
import {
  ValidationSection,
  SectionResult,
} from '@/server/validation/types';
import {
  runProblemSection,
  runMarketSection,
  runCompetitionSection,
  runAudienceSection,
  runFeasibilitySection,
  runPricingSection,
  runGoToMarketSection,
} from '@/server/validation/prompts';

type SectionHandler = (idea: { title: string; summary?: string; aiReview?: string }) => Promise<SectionResult>;

const SECTIONS: Array<Exclude<ValidationSection, 'overview'>> = [
  'problem',
  'market',
  'competition',
  'audience',
  'feasibility',
  'pricing',
  'go-to-market',
];

const SECTION_HANDLERS: Record<Exclude<ValidationSection, 'overview'>, SectionHandler> = {
  problem: runProblemSection,
  market: runMarketSection,
  competition: runCompetitionSection,
  audience: runAudienceSection,
  feasibility: runFeasibilitySection,
  pricing: runPricingSection,
  'go-to-market': runGoToMarketSection,
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, reportId } = await req.json();

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const context = await resolveValidationReportContext(userId, projectId, reportId);

    const aiReview = context.report.rationales
      ? Object.entries(context.report.rationales)
          .filter(([, value]) => typeof value === 'string' && value.length > 0)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : undefined;

    const idea = {
      title: context.ideaTitle,
      summary: context.ideaSummary,
      aiReview,
    };

    const results: Partial<Record<ValidationSection, SectionResult>> = {};
    const failures: Array<{ section: ValidationSection; message: string }> = [];

    for (const section of SECTIONS) {
      const handler = SECTION_HANDLERS[section];
      try {
        const result = await handler(idea);
        await clearSectionActions(context.reportId, section, result.actions);
        await updateSectionResult(context.reportId, section, result);
        results[section] = result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to run validation for this section';
        failures.push({ section, message });
      }
    }

    const overview = await calculateOverview(context.reportId);
    await updateSectionResult(context.reportId, 'overview', overview);

    return NextResponse.json(
      {
        reportId: context.reportId,
        sections: results,
        overview,
        failures,
      },
      { status: failures.length > 0 ? 207 : 200 }
    );
  } catch (error) {
    console.error('Validation run-all error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run validation' },
      { status: 500 }
    );
  }
}


