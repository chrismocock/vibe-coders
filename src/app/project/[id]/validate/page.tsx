'use client';

import { useParams } from 'next/navigation';
import { useAllSectionsData } from '@/components/validation/useAllSectionsData';
import { ValidationOverviewHero } from '@/components/validation/ValidationOverviewHero';
import { SectionScoreGrid } from '@/components/validation/SectionScoreGrid';
import { ScoreBreakdownChart } from '@/components/validation/ScoreBreakdownChart';
import { CompletionTracker } from '@/components/validation/CompletionTracker';
import { PriorityActions } from '@/components/validation/PriorityActions';
import { NextStepsCard } from '@/components/validation/NextStepsCard';
import { InsightsSummary } from '@/components/validation/InsightsSummary';
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
    isLoading,
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
        <h1 className="text-2xl font-bold text-neutral-900">Validation Overview</h1>
        <p className="text-neutral-600">
          Overall validation summary across all sections. This overview is automatically calculated from your completed validation sections.
        </p>
      </div>

      {/* Hero Section with Recommendation */}
      <ValidationOverviewHero
        score={metrics.averageScore}
        recommendation={metrics.recommendation as 'build' | 'revise' | 'drop'}
        completedCount={metrics.completedCount}
        totalCount={metrics.totalCount}
        strongSections={metrics.strongSections}
      />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Score Grid */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">All Sections</h2>
            <SectionScoreGrid sections={sectionsData} projectId={projectId} />
          </div>

          {/* Score Breakdown Chart */}
          <ScoreBreakdownChart sections={sectionsData} />

          {/* Priority Actions */}
          {allActions.length > 0 && (
            <PriorityActions
              sections={sectionsData}
              allActions={allActions}
              projectId={projectId}
            />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Completion Tracker */}
          <CompletionTracker
            sections={sectionsData}
            projectId={projectId}
            completedCount={metrics.completedCount}
            totalCount={metrics.totalCount}
          />

          {/* Insights Summary */}
          <InsightsSummary
            sections={sectionsData}
            averageScore={metrics.averageScore}
            strongestSection={strongestSection}
            weakestSection={weakestSection}
            strongSections={metrics.strongSections}
            weakSections={metrics.weakSections}
          />

          {/* Next Steps */}
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
    </div>
  );
}
