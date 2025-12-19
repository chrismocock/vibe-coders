import { getSupabaseServer } from '@/lib/supabaseServer';
import { runValidation } from '@/server/validation/runValidation';
import {
  createValidationReport,
  failValidationReport,
  updateValidationReport,
} from '@/server/validation/store';

interface StartValidationRunArgs {
  projectId: string;
  userId: string;
  idea: {
    title: string;
    summary?: string;
    aiReview?: string;
  };
}

export class StartValidationRunError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'StartValidationRunError';
    this.status = status;
  }
}

export async function startValidationRun({ projectId, userId, idea }: StartValidationRunArgs) {
  if (!idea.title?.trim()) {
    throw new StartValidationRunError('Idea title is required', 400);
  }

  const supabase = getSupabaseServer();
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project) {
    throw new StartValidationRunError('Project not found or unauthorized', 404);
  }

  let reportId: string;
  try {
    reportId = await createValidationReport(projectId, idea.title, idea.summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create validation report';
    throw new StartValidationRunError(message, 500);
  }

  runValidation(projectId, idea)
    .then(async (report) => {
      try {
        await updateValidationReport(reportId, report);
        await persistValidateStageSnapshot({
          projectId,
          userId,
          idea,
          report,
          reportId,
        });
      } catch (error) {
        console.error(`Error updating validation report ${reportId}:`, error);
        await failValidationReport(
          reportId,
          error instanceof Error ? error.message : 'Failed to update validation report',
        );
      }
    })
    .catch(async (error) => {
      console.error(`Error running validation for report ${reportId}:`, error);
      await failValidationReport(
        reportId,
        error instanceof Error ? error.message : 'Validation failed',
      );
    });

  return reportId;
}

async function persistValidateStageSnapshot({
  projectId,
  userId,
  idea,
  report,
  reportId,
}: {
  projectId: string;
  userId: string;
  idea: { title: string; summary?: string };
  report: Awaited<ReturnType<typeof runValidation>>;
  reportId: string;
}) {
  try {
    const supabase = getSupabaseServer();
    const inputData = {
      ideaTitle: idea.title,
      ideaSummary: idea.summary,
      reportId,
    };

    const outputData = {
      reportId,
      scores: report.scores,
      overallConfidence: report.overallConfidence,
      recommendation: report.recommendation,
      rationales: report.rationales,
      personas: report.personas,
      featureMap: report.featureMap,
      ideaEnhancement: report.ideaEnhancement,
      opportunityScore: report.opportunityScore,
      riskRadar: report.riskRadar,
    };

    const { data: existingStage, error: lookupError } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', projectId)
      .eq('stage', 'validate')
      .eq('user_id', userId)
      .maybeSingle();

    if (lookupError) {
      console.error('Failed to inspect validate stage snapshot:', lookupError);
      return;
    }

    const payload = {
      input: JSON.stringify(inputData),
      output: JSON.stringify(outputData),
      status: 'completed' as const,
      updated_at: new Date().toISOString(),
    };

    if (existingStage) {
      const { error } = await supabase
        .from('project_stages')
        .update(payload)
        .eq('id', existingStage.id);
      if (error) {
        console.error('Failed to update validate stage snapshot:', error);
      }
    } else {
      const { error } = await supabase.from('project_stages').insert({
        project_id: projectId,
        user_id: userId,
        stage: 'validate',
        input: payload.input,
        output: payload.output,
        status: payload.status,
        created_at: payload.updated_at,
        updated_at: payload.updated_at,
      });
      if (error) {
        console.error('Failed to create validate stage snapshot:', error);
      }
    }
  } catch (error) {
    console.error('Error persisting validate stage snapshot:', error);
  }
}
