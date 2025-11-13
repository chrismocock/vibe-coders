"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import LaunchTimelineCalendar from "@/components/launch/LaunchTimelineCalendar";
import { useParams } from "next/navigation";

export default function LaunchStrategyPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);
  const [timeframe, setTimeframe] = useState<7 | 14>(7);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          launchPathChoice: blueprint?.launch_path_choice,
          timeframe,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("strategy", data.result);
        markComplete("strategy");
      }
    } catch (error) {
      console.error("Failed to generate strategy:", error);
    } finally {
      setGenerating(false);
    }
  };

  const strategyPlan = blueprint?.strategy_plan;

  return (
    <LaunchSectionShell
      sectionId="strategy"
      title="Launch Strategy"
      description="Create a comprehensive launch plan with timeline, milestones, and target audiences."
      aiButton={
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Launch Strategy
            </>
          )}
        </Button>
      }
      nextSection="messaging"
      nextSectionLabel="Continue to Messaging & Positioning"
      onComplete={() => markComplete("strategy")}
    >
      <div className="space-y-6">
        {/* Timeframe Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Timeframe:</span>
          <Button
            variant={timeframe === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(7)}
          >
            7 Days
          </Button>
          <Button
            variant={timeframe === 14 ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(14)}
          >
            14 Days
          </Button>
        </div>

        {/* Timeline Calendar */}
        {strategyPlan && (
          <LaunchTimelineCalendar
            timeframe={strategyPlan.timeframe || timeframe}
            milestones={strategyPlan.milestones || []}
            onMilestonesChange={(milestones) =>
              saveSection("strategy", { ...strategyPlan, milestones })
            }
          />
        )}

        {/* Audiences */}
        {strategyPlan?.audiences && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Target Audiences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategyPlan.audiences.map((audience: any, idx: number) => (
                <div key={idx} className="p-4 border border-neutral-200 rounded-lg">
                  <h4 className="font-medium">{audience.name}</h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    {audience.description}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs font-medium">Channels:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {audience.channels?.map((channel: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LaunchSectionShell>
  );
}
