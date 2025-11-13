"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import { DELIVERABLES } from "@/lib/monetise/constants";
import { cn } from "@/lib/utils";

export default function MonetiseOverviewChecklist() {
  const { sectionCompletion } = useMonetiseBlueprint();

  const completedCount = DELIVERABLES.filter(
    (d) => sectionCompletion?.[d.id]
  ).length;
  const totalCount = DELIVERABLES.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Monetisation Deliverables
        </h3>
        <span className="text-sm text-neutral-600">
          {completedCount} of {totalCount} complete
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-2">
        {DELIVERABLES.map((deliverable) => {
          const isComplete = sectionCompletion?.[deliverable.id];
          return (
            <div
              key={deliverable.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                isComplete
                  ? "bg-green-50 border-green-200"
                  : "bg-neutral-50 border-neutral-200"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-neutral-400 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  isComplete ? "text-green-900" : "text-neutral-700"
                )}
              >
                {deliverable.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

