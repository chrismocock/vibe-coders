'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function PricingPage() {
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
  } = useSectionData(projectId, 'pricing');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Pricing Potential</h1>
        <p className="text-neutral-600">
          Evaluate pricing potential, willingness to pay, pricing models, and revenue potential.
        </p>
      </div>

      <SectionDisplay
        section="pricing"
        sectionLabel="Pricing"
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

