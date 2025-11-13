import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { 
  getOrCreateValidationReport, 
  getSectionResult, 
  updateSectionResult, 
  calculateOverview,
  clearSectionActions
} from '@/server/validation/store';
import { ValidationSection } from '@/server/validation/types';
import {
  runProblemSection,
  runMarketSection,
  runCompetitionSection,
  runAudienceSection,
  runFeasibilitySection,
  runPricingSection,
  runGoToMarketSection,
} from '@/server/validation/prompts';

const SECTION_HANDLERS: Record<string, (idea: { title: string; summary?: string; aiReview?: string }) => Promise<import('@/server/validation/types').SectionResult>> = {
  'problem': runProblemSection,
  'market': runMarketSection,
  'competition': runCompetitionSection,
  'audience': runAudienceSection,
  'feasibility': runFeasibilitySection,
  'pricing': runPricingSection,
  'go-to-market': runGoToMarketSection,
};

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
    const { projectId, reportId, idea } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Validate section name
    const validSections: ValidationSection[] = [
      'overview',
      'problem',
      'market',
      'competition',
      'audience',
      'feasibility',
      'pricing',
      'go-to-market',
    ];

    if (!validSections.includes(section as ValidationSection)) {
      return NextResponse.json(
        { error: `Invalid section: ${section}. Valid sections: ${validSections.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get or create validation report
    let finalReportId: string;
    if (reportId) {
      // Verify report belongs to project
      const { data: report, error: reportError } = await supabase
        .from('validation_reports')
        .select('id, project_id')
        .eq('id', reportId)
        .eq('project_id', projectId)
        .single();

      if (reportError || !report) {
        return NextResponse.json(
          { error: 'Report not found or unauthorized' },
          { status: 404 }
        );
      }
      finalReportId = reportId;
    } else {
      // Get idea info from project stages or use provided idea
      if (!idea?.title) {
        // Try to get from project stages
        const { data: validateStage } = await supabase
          .from('project_stages')
          .select('input')
          .eq('project_id', projectId)
          .eq('stage', 'validate')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (validateStage?.input) {
          try {
            const inputData = typeof validateStage.input === 'string'
              ? JSON.parse(validateStage.input)
              : validateStage.input;
            finalReportId = await getOrCreateValidationReport(
              projectId,
              inputData.ideaTitle || 'Untitled Idea',
              inputData.ideaSummary
            );
          } catch (e) {
            return NextResponse.json(
              { error: 'Could not determine idea information. Please provide idea.title in request body.' },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'idea.title is required when no reportId is provided' },
            { status: 400 }
          );
        }
      } else {
        finalReportId = await getOrCreateValidationReport(
          projectId,
          idea.title,
          idea.summary
        );
      }
    }

    // Handle overview section (calculated, no GPT-5 call)
    if (section === 'overview') {
      const overviewResult = await calculateOverview(finalReportId);
      await updateSectionResult(finalReportId, 'overview', overviewResult);
      return NextResponse.json(overviewResult);
    }

    // Handle other sections (GPT-5 calls)
    const handler = SECTION_HANDLERS[section];
    if (!handler) {
      return NextResponse.json(
        { error: `No handler found for section: ${section}` },
        { status: 500 }
      );
    }

    // Get idea info if not provided
    let ideaData = idea;
    if (!ideaData) {
      const { data: report } = await supabase
        .from('validation_reports')
        .select('idea_title, idea_summary')
        .eq('id', finalReportId)
        .single();

      if (report) {
        ideaData = {
          title: report.idea_title,
          summary: report.idea_summary || undefined,
        };
      } else {
        return NextResponse.json(
          { error: 'Could not determine idea information' },
          { status: 400 }
        );
      }
    }

    // Run section validation
    try {
      const result = await handler(ideaData);
      
      // Preserve completed actions when section is re-run
      if (section !== 'overview') {
        await clearSectionActions(finalReportId, section as ValidationSection, result.actions);
      }
      
      await updateSectionResult(finalReportId, section as ValidationSection, result);
      
      // Update overview after any section change
      const overviewResult = await calculateOverview(finalReportId);
      await updateSectionResult(finalReportId, 'overview', overviewResult);

      return NextResponse.json(result);
    } catch (error) {
      console.error(`Error running ${section} section:`, error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : `Failed to run ${section} section` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

