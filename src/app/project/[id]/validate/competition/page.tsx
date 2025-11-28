'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function CompetitionPage() {
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
  } = useSectionData(projectId, 'competition');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Competition Analysis</h1>
        <p className="text-neutral-600">
          Assess the competitive landscape, differentiation opportunities, and competitive positioning.
        </p>
      </div>

      <SectionDisplay
        section="competition"
        sectionLabel="Competition"
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

