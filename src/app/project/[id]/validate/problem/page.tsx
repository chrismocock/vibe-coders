'use client';

import { useParams } from 'next/navigation';
import { SectionDisplay } from '@/components/validation/SectionDisplay';
import { useSectionData } from '@/components/validation/useSectionData';

export default function ProblemPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data, isLoading, rerunSection } = useSectionData(projectId, 'problem');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Problem Validation</h1>
        <p className="text-neutral-600">
          Evaluate how well-defined, urgent, and valuable the problem is for your startup idea.
        </p>
      </div>

      <SectionDisplay
        section="problem"
        sectionLabel="Problem"
        data={data}
        isLoading={isLoading}
        onRerun={rerunSection}
        projectId={projectId}
      />
    </div>
  );
}

