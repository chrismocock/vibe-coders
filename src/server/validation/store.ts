import { getSupabaseServer } from '@/lib/supabaseServer';
import { ValidationReport, SectionResult, ValidationSection } from './types';

export interface ValidationReportRow {
  id: string;
  project_id: string;
  idea_title: string;
  idea_summary: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  scores: Record<string, number> | null;
  overall_confidence: number | null;
  recommendation: 'build' | 'revise' | 'drop' | null;
  rationales: Record<string, string> | null;
  agent_details: Record<string, unknown> | null;
  section_results: Record<string, SectionResult> | null;
  completed_actions: Record<string, string[]> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new validation report with 'running' status
 */
export async function createValidationReport(
  projectId: string,
  ideaTitle: string,
  ideaSummary?: string
): Promise<string> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('validation_reports')
    .insert({
      project_id: projectId,
      idea_title: ideaTitle,
      idea_summary: ideaSummary || null,
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create validation report: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error('Failed to create validation report: No ID returned');
  }

  return data.id;
}

/**
 * Update a validation report with results
 */
export async function updateValidationReport(
  reportId: string,
  report: ValidationReport
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('validation_reports')
    .update({
      status: 'succeeded',
      scores: report.scores,
      overall_confidence: report.overallConfidence,
      recommendation: report.recommendation,
      rationales: report.rationales,
      agent_details: report.agentDetails || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to update validation report: ${error.message}`);
  }
}

/**
 * Mark a validation report as failed
 */
export async function failValidationReport(
  reportId: string,
  errorMessage: string
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('validation_reports')
    .update({
      status: 'failed',
      error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to mark validation report as failed: ${error.message}`);
  }
}

/**
 * Get a validation report by ID
 */
export async function getValidationReportById(reportId: string): Promise<ValidationReportRow | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('validation_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch validation report: ${error.message}`);
  }

  return data;
}

/**
 * Convert database row to ValidationReport type
 */
export function rowToValidationReport(row: ValidationReportRow): ValidationReport {
  return {
    id: row.id,
    projectId: row.project_id,
    ideaTitle: row.idea_title,
    ideaSummary: row.idea_summary || undefined,
    scores: (row.scores as Record<string, number>) || {},
    overallConfidence: row.overall_confidence || 0,
    recommendation: row.recommendation || 'drop',
    rationales: row.rationales || {},
    agentDetails: row.agent_details || undefined,
  };
}

/**
 * Get section result for a specific section
 */
export async function getSectionResult(
  reportId: string,
  section: ValidationSection
): Promise<SectionResult | null> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('validation_reports')
    .select('section_results')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch section result: ${error.message}`);
  }

  const sectionResults = (data?.section_results as Record<string, SectionResult>) || {};
  return sectionResults[section] || null;
}

/**
 * Update section result for a specific section
 */
export async function updateSectionResult(
  reportId: string,
  section: ValidationSection,
  data: SectionResult
): Promise<void> {
  const supabase = getSupabaseServer();

  // Get current section_results
  const { data: currentData, error: fetchError } = await supabase
    .from('validation_reports')
    .select('section_results')
    .eq('id', reportId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current section results: ${fetchError.message}`);
  }

  const currentResults = (currentData?.section_results as Record<string, SectionResult>) || {};
  const updatedResults = {
    ...currentResults,
    [section]: {
      ...data,
      updated_at: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from('validation_reports')
    .update({
      section_results: updatedResults,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to update section result: ${error.message}`);
  }
}

/**
 * Get all section results for a report
 */
export async function getAllSectionResults(
  reportId: string
): Promise<Record<string, SectionResult>> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('validation_reports')
    .select('section_results')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {}; // Not found
    }
    throw new Error(`Failed to fetch section results: ${error.message}`);
  }

  return (data?.section_results as Record<string, SectionResult>) || {};
}

/**
 * Get or create validation report for a project
 * Returns the most recent validation report, or creates a new one if none exists
 */
export async function getOrCreateValidationReport(
  projectId: string,
  ideaTitle: string,
  ideaSummary?: string
): Promise<string> {
  const supabase = getSupabaseServer();
  
  // Try to get the most recent validation report for this project
  const { data: existingReports, error: fetchError } = await supabase
    .from('validation_reports')
    .select('id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch validation reports: ${fetchError.message}`);
  }

  if (existingReports && existingReports.length > 0) {
    return existingReports[0].id;
  }

  // No existing report, create a new one
  return createValidationReport(projectId, ideaTitle, ideaSummary);
}

/**
 * Calculate overview section from all other sections
 */
export async function calculateOverview(reportId: string): Promise<SectionResult> {
  const allResults = await getAllSectionResults(reportId);
  
  // Filter out overview itself
  const sections = Object.entries(allResults).filter(([key]) => key !== 'overview');
  
  if (sections.length === 0) {
    return {
      score: 0,
      summary: 'No validation sections have been completed yet. Run individual sections to see an overview.',
      actions: ['Start by running the Problem section', 'Then run Market and Competition sections'],
    };
  }

  // Calculate average score
  const scores = sections.map(([, result]) => result.score);
  const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  // Aggregate top actions (up to 5)
  const allActions = sections.flatMap(([, result]) => result.actions);
  const uniqueActions = Array.from(new Set(allActions)).slice(0, 5);

  // Determine recommendation
  let recommendation: string;
  if (avgScore >= 70) {
    recommendation = 'build';
  } else if (avgScore >= 40) {
    recommendation = 'revise';
  } else {
    recommendation = 'drop';
  }

  // Generate summary
  const summary = `Overall validation score: ${avgScore}/100. Based on ${sections.length} completed sections, the recommendation is to ${recommendation}. ` +
    `Key strengths: ${sections.filter(([, r]) => r.score >= 70).length} sections scored 70+. ` +
    `Areas for improvement: ${sections.filter(([, r]) => r.score < 40).length} sections scored below 40.`;

  return {
    score: avgScore,
    summary,
    actions: uniqueActions,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get completed actions for a specific section
 */
export async function getCompletedActions(
  reportId: string,
  section: ValidationSection
): Promise<string[]> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase
    .from('validation_reports')
    .select('completed_actions')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return []; // Not found
    }
    throw new Error(`Failed to fetch completed actions: ${error.message}`);
  }

  const completedActions = (data?.completed_actions as Record<string, string[]>) || {};
  return completedActions[section] || [];
}

/**
 * Toggle action completion for a specific section
 */
export async function toggleActionCompletion(
  reportId: string,
  section: ValidationSection,
  actionText: string,
  completed: boolean
): Promise<void> {
  const supabase = getSupabaseServer();

  // Get current completed_actions
  const { data: currentData, error: fetchError } = await supabase
    .from('validation_reports')
    .select('completed_actions')
    .eq('id', reportId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current completed actions: ${fetchError.message}`);
  }

  const currentActions = (currentData?.completed_actions as Record<string, string[]>) || {};
  const sectionActions = currentActions[section] || [];

  let updatedSectionActions: string[];
  if (completed) {
    // Add action if not already present
    updatedSectionActions = sectionActions.includes(actionText)
      ? sectionActions
      : [...sectionActions, actionText];
  } else {
    // Remove action
    updatedSectionActions = sectionActions.filter((action) => action !== actionText);
  }

  const updatedActions = {
    ...currentActions,
    [section]: updatedSectionActions,
  };

  const { error } = await supabase
    .from('validation_reports')
    .update({
      completed_actions: updatedActions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to update completed actions: ${error.message}`);
  }
}

/**
 * Clear completed actions for a section when it's re-run
 * Preserves actions that match the new action list
 */
export async function clearSectionActions(
  reportId: string,
  section: ValidationSection,
  newActions: string[]
): Promise<void> {
  const supabase = getSupabaseServer();

  // Get current completed_actions
  const { data: currentData, error: fetchError } = await supabase
    .from('validation_reports')
    .select('completed_actions')
    .eq('id', reportId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current completed actions: ${fetchError.message}`);
  }

  const currentActions = (currentData?.completed_actions as Record<string, string[]>) || {};
  const sectionActions = currentActions[section] || [];

  // Keep only actions that exist in the new action list
  const preservedActions = sectionActions.filter((action) => newActions.includes(action));

  const updatedActions = {
    ...currentActions,
    [section]: preservedActions,
  };

  const { error } = await supabase
    .from('validation_reports')
    .update({
      completed_actions: updatedActions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to clear section actions: ${error.message}`);
  }
}

