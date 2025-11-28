'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function MarketPage() {
  const params = useParams();
  const projectId = params.id as string;
  const {
    data,
    completedActions,
    personaReactions,
    isLoading,
    rerunSection,
    toggleAction,
    refreshPersonaReactions,
    deepenAnalysis,
  } = useSectionData(projectId, 'market');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Market Validation</h1>
        <p className="text-neutral-600">
          Assess market demand, size, growth potential, and market trends.
        </p>
      </div>

      <SectionDisplay
        section="market"
        sectionLabel="Market"
        data={data}
        completedActions={completedActions}
        isLoading={isLoading}
        onRerun={rerunSection}
        onToggleAction={toggleAction}
        onDeepenAnalysis={deepenAnalysis}
        personaReactions={personaReactions}
        onRefreshPersonaReactions={refreshPersonaReactions}
        projectId={projectId}
      />
    </div>
  );
}

