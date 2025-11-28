import { getSupabaseServer } from '@/lib/supabaseServer';
import { rowToValidationReport, ValidationReportRow } from './store';
import { ValidationReport } from './types';

export interface ValidationReportContext {
  reportId: string;
  projectId: string;
  ideaTitle: string;
  ideaSummary?: string;
  row: ValidationReportRow;
  report: ValidationReport;
}

export async function resolveValidationReportContext(
  userId: string,
  projectId: string,
  reportId?: string
): Promise<ValidationReportContext> {
  const supabase = getSupabaseServer();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found or unauthorized');
  }

  let reportRow: ValidationReportRow | null = null;

  if (reportId) {
    const { data, error } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', reportId)
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      throw new Error('Validation report not found or unauthorized');
    }

    reportRow = data as ValidationReportRow;
  } else {
    const { data, error } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('No validation report available for this project');
    }

    reportRow = data as ValidationReportRow;
  }

  const report = rowToValidationReport(reportRow);

  return {
    reportId: reportRow.id,
    projectId,
    ideaTitle: reportRow.idea_title,
    ideaSummary: reportRow.idea_summary || undefined,
    row: reportRow,
    report,
  };
}

