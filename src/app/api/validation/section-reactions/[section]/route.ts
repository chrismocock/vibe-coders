import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveValidationReportContext } from '@/server/validation/context';
import { runPersonaReactionsAgent } from '@/server/validation/agents';
import { updatePersonaReactions } from '@/server/validation/store';
import { SectionResult, ValidationSection } from '@/server/validation/types';
import { formatPersonas, formatSectionResult } from '@/server/validation/formatters';

const VALID_SECTIONS: ValidationSection[] = [
  'overview',
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
      return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { projectId, reportId } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const context = await resolveValidationReportContext(userId, projectId, reportId);
    const sectionResults = (context.row.section_results as Record<string, SectionResult>) || {};
    const sectionData = sectionResults[section] ?? null;
    const formattedSection = formatSectionResult(sectionData);

    const reactions = await runPersonaReactionsAgent({
      section: section as ValidationSection,
      title: context.ideaTitle,
      summary: context.ideaSummary,
      personas: formatPersonas(context.report.personas),
      sectionInsights: formattedSection,
    });

    await updatePersonaReactions(context.reportId, section as ValidationSection, reactions);

    return NextResponse.json({
      reportId: context.reportId,
      section,
      reactions,
    });
  } catch (error) {
    console.error('Validation persona reactions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate persona reactions' },
      { status: 500 }
    );
  }
}

