"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import { useParams, useRouter } from "next/navigation";
import { LAUNCH_SECTIONS } from "@/lib/launch/constants";

interface LaunchSectionShellProps {
  sectionId: string;
  title: string;
  description: string;
  children: ReactNode;
  aiButton?: ReactNode;
  nextSection?: string;
  nextSectionLabel?: string;
  onComplete?: () => void;
}

export default function LaunchSectionShell({
  sectionId,
  title,
  description,
  children,
  aiButton,
  nextSection,
  nextSectionLabel,
  onComplete,
}: LaunchSectionShellProps) {
  const { saving, sectionCompletion, markComplete } = useLaunchBlueprint();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isComplete = sectionCompletion?.[sectionId];

  const handleNext = () => {
    if (onComplete) {
      onComplete();
    }
    if (nextSection) {
      router.push(`/project/${projectId}/launch/${nextSection}`);
    }
  };

  const sectionOrder = Object.values(LAUNCH_SECTIONS);
  const currentIndex = sectionOrder.indexOf(sectionId as any);
  const nextSectionId = nextSection || (currentIndex < sectionOrder.length - 1 ? sectionOrder[currentIndex + 1] : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
            <p className="text-neutral-600 mt-1">{description}</p>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>

        {/* AI Button Slot */}
        {aiButton && <div className="mt-4">{aiButton}</div>}
      </div>

      {/* Save Status */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Next Section Button */}
      {nextSectionId && (
        <div className="flex justify-end pt-6 border-t border-neutral-200">
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
            disabled={saving}
          >
            {nextSectionLabel || `Continue to ${nextSectionId}`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

