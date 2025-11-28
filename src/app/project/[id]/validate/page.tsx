'use client';

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
import { Loader2 } from 'lucide-react';

export default function OverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Your AI Product Advisor</h1>
        <p className="text-neutral-600">
          Zero-effort validation, investor-ready insights, and a design-ready blueprint delivered automatically.
        </p>
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
