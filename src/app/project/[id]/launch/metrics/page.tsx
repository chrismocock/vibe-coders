"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wand2, Download, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { METRIC_TYPES } from "@/lib/launch/constants";
import { useParams } from "next/navigation";

export default function LaunchMetricsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);

  const metrics = blueprint?.tracking_metrics || {};

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/metrics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("metrics", data.result);
        markComplete("metrics");
      }
    } catch (error) {
      console.error("Failed to generate metrics plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    const content = JSON.stringify(metrics, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metrics-plan.json";
    a.click();
  };

  return (
    <LaunchSectionShell
      sectionId="metrics"
      title="Tracking & Metrics"
      description="Set up tracking goals, events, and metrics dashboard for your launch."
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
              Generate Metrics Plan
            </>
          )}
        </Button>
      }
      nextSection="pack"
      nextSectionLabel="Continue to Launch Pack"
      onComplete={() => markComplete("metrics")}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>

        {/* Goals */}
        {metrics.goals && metrics.goals.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tracking Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.goals.map((goal: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {goal.metric?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium">Target</label>
                        <Input
                          type="number"
                          value={goal.target || ""}
                          onChange={(e) => {
                            const newGoals = [...metrics.goals];
                            newGoals[idx] = { ...goal, target: parseInt(e.target.value) };
                            saveSection("metrics", { ...metrics, goals: newGoals });
                          }}
                        />
                      </div>
                      <p className="text-sm text-neutral-600">{goal.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {metrics.events && metrics.events.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tracking Events</h3>
            <div className="space-y-2">
              {metrics.events.map((event: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="font-medium">{event.name}</div>
                    <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                    <p className="text-xs text-neutral-500 mt-1">Trigger: {event.trigger}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard */}
        {metrics.dashboard && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dashboard Layout</h3>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-neutral-600">{metrics.dashboard.layout}</p>
                {metrics.dashboard.keyMetrics && (
                  <div className="mt-4">
                    <span className="text-xs font-medium">Key Metrics:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {metrics.dashboard.keyMetrics.map((m: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </LaunchSectionShell>
  );
}

