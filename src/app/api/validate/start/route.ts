import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { createValidationReport, updateValidationReport, failValidationReport } from '@/server/validation/store';
import { runValidation } from '@/server/validation/runValidation';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, idea } = await req.json();
    // idea should contain: { title: string, summary?: string, aiReview?: string }
    
    if (!projectId || !idea?.title) {
      return NextResponse.json(
        { error: 'projectId and idea.title are required' },
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

    // Create validation report with 'running' status
    let reportId: string;
    try {
      reportId = await createValidationReport(projectId, idea.title, idea.summary);
    } catch (error) {
      console.error('Error creating validation report:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create validation report' },
        { status: 500 }
      );
    }

    // Run validation asynchronously (don't await - return immediately)
    runValidation(projectId, idea)
      .then(async (report) => {
        try {
          await updateValidationReport(reportId, report);
          console.log(`Validation completed successfully for report ${reportId}`);
          
          // Automatically save the validate stage as completed
          try {
            const inputData = {
              ideaTitle: idea.title,
              ideaSummary: idea.summary,
              reportId: reportId,
            };
            
            const outputData = {
              reportId: reportId,
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
            
            // Check if validate stage already exists
            const { data: existingStage } = await supabase
              .from('project_stages')
              .select('id')
              .eq('project_id', projectId)
              .eq('stage', 'validate')
              .eq('user_id', userId)
              .single();
            
            if (existingStage) {
              // Update existing stage
              const { error: updateError } = await supabase
                .from('project_stages')
                .update({
                  input: JSON.stringify(inputData),
                  output: JSON.stringify(outputData),
                  status: 'completed',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingStage.id);
              
              if (updateError) {
                console.error('Failed to update validate stage:', updateError);
              } else {
                console.log('Validate stage updated as completed');
              }
            } else {
              // Create new stage
              const { error: insertError } = await supabase
                .from('project_stages')
                .insert({
                  project_id: projectId,
                  user_id: userId,
                  stage: 'validate',
                  input: JSON.stringify(inputData),
                  output: JSON.stringify(outputData),
                  status: 'completed',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (insertError) {
                console.error('Failed to create validate stage:', insertError);
              } else {
                console.log('Validate stage created as completed');
              }
            }
          } catch (stageError) {
            console.error('Error saving validate stage:', stageError);
            // Don't fail the validation if stage save fails - the report is still saved
          }
        } catch (error) {
          console.error(`Error updating validation report ${reportId}:`, error);
          await failValidationReport(
            reportId,
            error instanceof Error ? error.message : 'Failed to update validation report'
          );
        }
      })
      .catch(async (error) => {
        console.error(`Error running validation for report ${reportId}:`, error);
        await failValidationReport(
          reportId,
          error instanceof Error ? error.message : 'Validation failed'
        );
      });

    // Return immediately with reportId so client can poll for status
    return NextResponse.json({ reportId });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

