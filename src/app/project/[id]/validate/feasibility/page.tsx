'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function FeasibilityPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data, completedActions, isLoading, rerunSection, toggleAction } = useSectionData(projectId, 'feasibility');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Feasibility Analysis</h1>
        <p className="text-neutral-600">
          Assess technical feasibility, resource requirements, timeline, and implementation complexity.
        </p>
      </div>

      <SectionDisplay
        section="feasibility"
        sectionLabel="Feasibility"
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

