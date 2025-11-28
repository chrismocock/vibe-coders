'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function AudiencePage() {
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
  } = useSectionData(projectId, 'audience');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Audience Fit</h1>
        <p className="text-neutral-600">
          Evaluate audience fit, demographics, behaviors, needs, and product-market fit.
        </p>
      </div>

      <SectionDisplay
        section="audience"
        sectionLabel="Audience"
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

