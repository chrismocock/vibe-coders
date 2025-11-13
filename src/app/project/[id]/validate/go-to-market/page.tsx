'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function GoToMarketPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data, completedActions, isLoading, rerunSection, toggleAction } = useSectionData(projectId, 'go-to-market');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Go-To-Market Strategy</h1>
        <p className="text-neutral-600">
          Analyze GTM strategy, channels, positioning, messaging, and customer acquisition.
        </p>
      </div>

      <SectionDisplay
        section="go-to-market"
        sectionLabel="Go-To-Market"
        data={data}
        completedActions={completedActions}
        isLoading={isLoading}
        onRerun={rerunSection}
        onToggleAction={toggleAction}
        projectId={projectId}
      />
    </div>
  );
}

