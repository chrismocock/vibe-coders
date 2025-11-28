'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAllSectionsData } from '@/components/validation/useAllSectionsData';
import { ValidationOverviewHero } from '@/components/validation/ValidationOverviewHero';
import { SectionScoreGrid } from '@/components/validation/SectionScoreGrid';
import { ScoreBreakdownChart } from '@/components/validation/ScoreBreakdownChart';
import { CompletionTracker } from '@/components/validation/CompletionTracker';
import { PriorityActions } from '@/components/validation/PriorityActions';
import { NextStepsCard } from '@/components/validation/NextStepsCard';
import { AIExecutiveSummary } from '@/components/validation/AIExecutiveSummary';
import { OpportunityScoreCard } from '@/components/validation/OpportunityScoreCard';
import { RiskRadarCard } from '@/components/validation/RiskRadarCard';
import { PersonasPreview } from '@/components/validation/PersonasPreview';
import { FeatureOpportunityPreview } from '@/components/validation/FeatureOpportunityPreview';
import { IdeaEnhancerPreview } from '@/components/validation/IdeaEnhancerPreview';
import { SendToDesignBanner } from '@/components/validation/SendToDesignBanner';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function OverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [isRunningAll, setIsRunningAll] = useState(false);
  const {
    sectionsData,
    overviewData,
    metrics,
    sectionsNeedingAttention,
    strongestSection,
    weakestSection,
    opportunityScore,
    riskRadar,
    personas,
    featureMap,
    ideaEnhancement,
    executiveSummary,
    reportDetails,
    isLoading,
    refresh,
  } = useAllSectionsData(projectId);

  const handleRunAllValidation = async () => {
    if (!reportDetails?.id) {
      toast.error('Run validation first to create a report.');
      return;
    }

    try {
      setIsRunningAll(true);
      const response = await fetch('/api/validation/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportId: reportDetails.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to run validation on all sections');
      }

      await refresh();
      window.dispatchEvent(new Event('section-updated'));
      toast.success('Full validation completed for all sections.');
    } catch (error) {
      console.error('Run all validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run validation');
    } finally {
      setIsRunningAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">Loading validation overview...</span>
      </div>
    );
  }

  // Collect all actions from all sections
  const allActions = sectionsData
    .filter((s) => s.result)
    .flatMap((s) => s.result!.actions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Your AI Product Advisor</h1>
          <p className="text-neutral-600">
            Zero-effort validation, investor-ready insights, and a design-ready blueprint delivered automatically.
          </p>
        </div>
        <Button
          onClick={handleRunAllValidation}
          disabled={isRunningAll}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isRunningAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Validation...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run Full Validation
            </>
          )}
        </Button>
      </div>

      <AIExecutiveSummary summary={executiveSummary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <OpportunityScoreCard score={opportunityScore} />
          <RiskRadarCard risk={riskRadar} />
          <PersonasPreview personas={personas} />
          <FeatureOpportunityPreview featureMap={featureMap} />

          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Section Scores</h2>
            <SectionScoreGrid sections={sectionsData} projectId={projectId} />
          </div>

          <ScoreBreakdownChart sections={sectionsData} />

          {allActions.length > 0 && (
            <PriorityActions sections={sectionsData} allActions={allActions} projectId={projectId} />
          )}
        </div>

        <div className="space-y-6">
          <ValidationOverviewHero
            score={metrics.averageScore}
            recommendation={metrics.recommendation as 'build' | 'revise' | 'drop'}
            completedCount={metrics.completedCount}
            totalCount={metrics.totalCount}
            strongSections={metrics.strongSections}
          />

          <IdeaEnhancerPreview
            enhancement={ideaEnhancement}
            projectId={projectId}
            reportId={reportDetails?.id}
            onRefresh={refresh}
          />

          <CompletionTracker
            sections={sectionsData}
            projectId={projectId}
            completedCount={metrics.completedCount}
            totalCount={metrics.totalCount}
          />

          <NextStepsCard
            sections={sectionsData}
            recommendation={metrics.recommendation as 'build' | 'revise' | 'drop'}
            completedCount={metrics.completedCount}
            totalCount={metrics.totalCount}
            projectId={projectId}
            averageScore={metrics.averageScore}
          />
        </div>
      </div>

      <SendToDesignBanner projectId={projectId} reportId={reportDetails?.id} />
    </div>
  );
}
