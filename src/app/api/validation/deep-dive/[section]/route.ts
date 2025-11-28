import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runDeepDiveAgent } from '@/server/validation/agents';
import { getSectionResult, updateSectionResult } from '@/server/validation/store';
import { SectionResult, ValidationSection } from '@/server/validation/types';
import {
  formatSectionResult,
  formatPersonas,
  formatFeatureMap,
  formatIdeaEnhancement,
} from '@/server/validation/formatters';

const VALID_SECTIONS: ValidationSection[] = [
  'problem',
  'market',
  'competition',
  'audience',
  'feasibility',
  'pricing',
  'go-to-market',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { section } = await params;
    if (!VALID_SECTIONS.includes(section as ValidationSection)) {
      return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
    }

    const body = await req.json();
    const { projectId, reportId } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const context = await resolveValidationReportContext(userId, projectId, reportId);
    const existingSection = await getSectionResult(context.reportId, section as ValidationSection);

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Section has no baseline insights yet. Run the section first.' },
        { status: 400 }
      );
    }

    const deepDive = await runDeepDiveAgent({
      section: section as ValidationSection,
      title: context.ideaTitle,
      summary: context.ideaSummary,
      sectionInsights: formatSectionResult(existingSection),
      personas: formatPersonas(context.report.personas),
      featureMap: formatFeatureMap(context.report.featureMap),
      ideaEnhancement: formatIdeaEnhancement(context.report.ideaEnhancement),
    });

    const updatedSection: SectionResult = {
      ...existingSection,
      deepDive,
    };

    await updateSectionResult(context.reportId, section as ValidationSection, updatedSection);

    return NextResponse.json({
      reportId: context.reportId,
      section,
      deepDive,
    });
  } catch (error) {
    console.error('Validation deep dive error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deepen analysis' },
      { status: 500 }
    );
  }
}

