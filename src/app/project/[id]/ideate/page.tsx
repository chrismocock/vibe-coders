"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IdeateHeader,
  StickyActionBar,
} from "@/components/ideate/IdeateHeader";
import { PitchCard } from "@/components/ideate/PitchCard";
import { QuickTakeGrid } from "@/components/ideate/QuickTakeGrid";
import { RisksOpportunities } from "@/components/ideate/RisksOpportunities";
import { BestImprovementsList } from "@/components/ideate/BestImprovementsList";
import { ChangeLogTimeline } from "@/components/ideate/ChangeLogTimeline";
import { PillarSummaryStrip } from "@/components/ideate/PillarSummaryStrip";
import { PillarAccordion } from "@/components/ideate/PillarAccordion";
import { SevenDayPlanTimeline } from "@/components/ideate/SevenDayPlanTimeline";
import { ExperimentsTable } from "@/components/ideate/ExperimentsTable";
import { MetricsCard } from "@/components/ideate/MetricsCard";
import { ValidateHandoffPanel } from "@/components/ideate/ValidateHandoffPanel";
import type {
  Experiment,
  IdeateRun,
  PillarSnapshot,
  QuickTake,
  Suggestion,
} from "@/lib/ideate/types";

const fallbackRun: IdeateRun = {
  id: "run-001",
  projectId: "",
  userId: "",
  headline: "Boost conversion on the self-serve onboarding funnel",
  narrative:
    "Increase activation for workspace admins by clarifying value, reducing friction, and creating a more compelling first project path.",
  lastRunAt: new Date().toISOString(),
  quickTakes: [
    { label: "Overall", value: "7.6 / 10", delta: "+0.8" },
    { label: "Confidence", value: "Moderate", delta: "↑" },
    { label: "Theme", value: "Guided onboarding" },
    { label: "Effort", value: "2 sprints" },
  ],
  risks: [
    "Messaging changes could depress signups if not tested with multiple segments.",
    "Requires coordination with analytics to measure activation correctly.",
  ],
  opportunities: [
    "Segmented onboarding paths for admins vs members unlock faster aha moments.",
    "Small nudges in the first 3 minutes drive outsized conversion lifts.",
  ],
  pillars: [
    {
      id: "audienceFit",
      pillarId: "audienceFit",
      name: "Audience Fit",
      score: 7.8,
      delta: 0.6,
      summary: "Messaging now leads with admin value; still weak for enterprise security needs.",
      opportunities: [
        "Showcase admin-only workflows in hero and onboarding.",
        "Add a security highlights micro-page in the flow.",
      ],
      risks: ["Enterprise blockers could slow adoption without SOC2 messaging."],
    },
    {
      id: "competition",
      pillarId: "competition",
      name: "Competition",
      score: 7.0,
      delta: 0.4,
      summary: "Differentiation clearer via automations; pricing parity still a question.",
      opportunities: ["Highlight automation library vs competitors."],
      risks: ["Comparisons may invite price discounting conversations."],
    },
    {
      id: "feasibility",
      pillarId: "feasibility",
      name: "Feasibility",
      score: 7.2,
      delta: -0.3,
      summary: "Engineering confident in guided setup but needs analytics support for experiments.",
      opportunities: ["Bundle instrumentation tasks into sprint 1."],
      risks: ["Analytics resourcing could delay testing windows."],
    },
    {
      id: "marketDemand",
      pillarId: "marketDemand",
      name: "Market Demand",
      score: 7.5,
      delta: 0.5,
      summary: "Automation and workflow clarity resonate in SMB; enterprise proof points growing.",
      opportunities: ["Lean into ROI stories in onboarding."],
      risks: ["Enterprise buyers may require more social proof."],
    },
    {
      id: "pricingPotential",
      pillarId: "pricingPotential",
      name: "Pricing Potential",
      score: 7.1,
      delta: 0.1,
      summary: "Pricing confidence improving with clearer tiering; enterprise packaging still open.",
      opportunities: ["Offer admin-focused add-ons."],
      risks: ["Discount pressure from competitors."],
    },
  ],
  suggestions: [
    {
      id: "s1",
      pillarId: "audienceFit",
      title: "Guided aha moments",
      description:
        "Lead with admin outcomes and a guided flow that makes automation value obvious in the first session.",
      impact: "High",
      effort: "Medium",
      applied: false,
    },
    {
      id: "s2",
      pillarId: "competition",
      title: "Automation gallery CTA",
      description: "Expose three automation wins in the first session to make differentiation obvious.",
      impact: "Medium",
      effort: "Low",
      applied: false,
    },
    {
      id: "s3",
      pillarId: "feasibility",
      title: "Analytics guardrails",
      description: "Ship a minimal instrumentation checklist to keep experiments trustworthy.",
      impact: "Medium",
      effort: "Low",
      applied: true,
    },
  ],
  experiments: [
    {
      id: "exp-1",
      name: "Template-led onboarding",
      goal: "Lift admin activation to 42%",
      owner: "Nina",
      startDate: "Jun 3",
      status: "draft",
    },
    {
      id: "exp-2",
      name: "Automation gallery spotlight",
      goal: "Increase aha rate by 10%",
      owner: "Kai",
      startDate: "Jun 4",
      status: "validating",
    },
  ],
};

const mockPlan = [
  { day: "Day 1", label: "Align", detail: "Lock personas, success metric, and analytics owners." },
  { day: "Day 2", label: "Prototype", detail: "Build onboarding presets and automation gallery stubs." },
  { day: "Day 3", label: "Instrument", detail: "Ship tracking + guardrails checklist." },
  { day: "Day 4", label: "Launch", detail: "Expose new flow to 30% of traffic." },
  { day: "Day 5", label: "Measure", detail: "Monitor activation + aha rate with QA." },
  { day: "Day 6", label: "Tune", detail: "Tighten messaging and fix drop-off spots." },
  { day: "Day 7", label: "Decide", detail: "Promote to 100% or iterate with new hypotheses." },
];

export default function IdeatePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [run, setRun] = useState<IdeateRun | null>(null);
  const [pillars, setPillars] = useState<PillarSnapshot[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [quickTakes, setQuickTakes] = useState<QuickTake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [refreshingPillars, setRefreshingPillars] = useState(false);
  const [hasPushed, setHasPushed] = useState(false);

  const activeRun = run ?? { ...fallbackRun, projectId: projectId ?? "" };

  const applyRunToState = (incoming: IdeateRun) => {
    setRun(incoming);
    setPillars(incoming.pillars ?? []);
    setSuggestions(incoming.suggestions ?? []);
    setExperiments(incoming.experiments ?? []);
    setQuickTakes(incoming.quickTakes ?? []);
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchRun = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ideate/run?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          applyRunToState(data.run);
        } else if (res.status === 404) {
          applyRunToState({ ...fallbackRun, projectId });
        } else {
          throw new Error("Failed to load ideate run");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        applyRunToState({ ...fallbackRun, projectId });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRun();
  }, [projectId]);

  const activeSummary = useMemo(
    () => `Iteration ${activeRun.id} • Updated ${new Date(activeRun.lastRunAt).toLocaleDateString()}`,
    [activeRun.id, activeRun.lastRunAt],
  );

  const snapshotSummary =
    "AI recommends leading with guided onboarding, clear admin value, and tighter analytics guardrails.";
  const pillarsSummary =
    "Confidence improving across pillars; audience fit leads momentum and feasibility needs analytics support.";
  const planSummary =
    "Seven-day plan is queued; experiments are ready to validate with analytics owners on deck.";

  const handleRunIdeate = async () => {
    if (!projectId) return;
    setIsRunning(true);
    toast.loading("Running ideate across pillars...", { id: "run-ideate" });

    try {
      const res = await fetch("/api/ideate/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activeRun,
          quickTakes,
          pillars,
          suggestions,
          experiments,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to run ideation");
      }

      const data = await res.json();
      applyRunToState(data.run);
      toast.success("New ideation complete", { id: "run-ideate" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run ideation", { id: "run-ideate" });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePushValidate = async () => {
    if (!projectId) return;

    toast.loading("Handing off to Validate...", { id: "push-validate" });
    try {
      const res = await fetch("/api/validate/import-from-ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, runId: activeRun.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to push to Validate");
      }

      setHasPushed(true);
      toast.success("Handed off to Validate with latest plan.", { id: "push-validate" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to push to Validate", { id: "push-validate" });
    }
  };

  const handleApply = async (suggestionId: string) => {
    const previousSuggestions = [...suggestions];
    setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, applied: true } : s)));
    setQuickTakes((prev) => prev.map((qt, index) => (index === 0 ? { ...qt, delta: "+0.1" } : qt)));

    try {
      const res = await fetch(`/api/ideate/suggestion/${suggestionId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, runId: activeRun.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to apply suggestion");
      }

      const data = await res.json();
      if (data.run) {
        applyRunToState(data.run);
      }
      toast.success("Applied to backlog");
    } catch (err) {
      setSuggestions(previousSuggestions);
      setQuickTakes(run?.quickTakes ?? quickTakes);
      toast.error(err instanceof Error ? err.message : "Unable to apply suggestion");
    }
  };

  const handleSendExperiment = (experimentId: string) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === experimentId ? { ...exp, status: "validating" } : exp)),
    );
    toast.success("Sent to Validate");
  };

  const handleRefreshPillars = async (pillarId: string) => {
    if (!projectId) return;

    setRefreshingPillars(true);
    toast.loading("Re-running pillar scoring...", { id: `pillar-${pillarId}` });

    try {
      const res = await fetch(`/api/ideate/pillar/${pillarId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, runId: activeRun.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to refresh pillar");
      }

      const data = await res.json();
      if (data.run) {
        applyRunToState(data.run);
      } else if (data.pillar) {
        setPillars((prev) => prev.map((p) => (p.pillarId === data.pillar.pillarId ? data.pillar : p)));
      }

      toast.success("Pillar refreshed", { id: `pillar-${pillarId}` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to refresh pillar", {
        id: `pillar-${pillarId}`,
      });
    } finally {
      setRefreshingPillars(false);
    }
  };

  const handleRefreshPlan = async () => {
    if (!projectId) return;

    setPitchLoading(true);
    toast.loading("Regenerating pitch and quick takes...", { id: "pitch-variants" });
    try {
      const res = await fetch("/api/ideate/pitch-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, runId: activeRun.id, headline: activeRun.headline }),
      });

      if (!res.ok) {
        throw new Error("Failed to refresh pitch");
      }

      const data = await res.json();
      if (data.quickTakes) {
        setQuickTakes(data.quickTakes);
        setRun((prev) => (prev ? { ...prev, quickTakes: data.quickTakes } : prev));
      }
      toast.success("Pitch updated", { id: "pitch-variants" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to refresh pitch", {
        id: "pitch-variants",
      });
    } finally {
      setPitchLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading ideate run...</p>;
  }

  return (
    <div className="space-y-6 pb-20">
      {error && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3 text-sm text-amber-800">
            {error}. Showing the latest saved ideate run.
          </CardContent>
        </Card>
      )}

      <IdeateHeader
        projectId={projectId}
        headline={activeRun.headline}
        summary={activeSummary}
        onRunIdeate={handleRunIdeate}
        onPushValidate={handlePushValidate}
        isRunning={isRunning}
        hasPushed={hasPushed}
      />

      <Tabs defaultValue="snapshot" className="space-y-6">
        <TabsList className="w-full justify-start gap-2">
          <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
          <TabsTrigger value="pillars">Pillars</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="snapshot" className="space-y-4">
          <PitchCard
            title="Snapshot"
            summary={snapshotSummary}
            analysis={activeRun.narrative}
            quickMetrics={quickTakes}
          />

          <QuickTakeGrid items={quickTakes} />

          <div className="grid gap-4 md:grid-cols-2">
            <RisksOpportunities risks={activeRun.risks} opportunities={activeRun.opportunities} />
            <MetricsCard
              title="Momentum"
              value={pitchLoading ? "Refreshing..." : "Trending up"}
              badge={pitchLoading ? "Updating" : "Live"}
            />
          </div>

          <BestImprovementsList
            items={suggestions}
            onApply={handleApply}
            onGenerate={() => handleRefreshPillars(pillars[0]?.pillarId || "audienceFit")}
          />

          <ChangeLogTimeline />
        </TabsContent>

        <TabsContent value="pillars" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Pillars overview</CardTitle>
                <p className="text-sm text-muted-foreground">{pillarsSummary}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefreshPillars(pillars[0]?.pillarId || "audienceFit")}
                disabled={refreshingPillars}
              >
                {refreshingPillars ? "Refreshing..." : "Refresh pillars"}
              </Button>
            </CardHeader>
          </Card>
          <PillarSummaryStrip pillars={pillars} />
          <PillarAccordion
            pillars={pillars}
            suggestions={suggestions}
            onApply={handleApply}
            onGenerate={handleRefreshPillars}
          />
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Plan summary</CardTitle>
                <p className="text-sm text-muted-foreground">{planSummary}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshPlan} disabled={pitchLoading}>
                {pitchLoading ? "Refreshing..." : "Regenerate plan"}
              </Button>
            </CardHeader>
          </Card>
          <SevenDayPlanTimeline items={mockPlan} />

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Experiments</p>
                  <p className="text-xl font-semibold">Ready for validation</p>
                </div>
                <Badge variant="secondary">{experiments.filter((exp) => exp.status === "validating").length} running</Badge>
              </div>
              <ExperimentsTable items={experiments} onSend={handleSendExperiment} />
            </CardContent>
          </Card>

          <ValidateHandoffPanel hasPushed={hasPushed} onPush={handlePushValidate} />

          <ChangeLogTimeline />
        </TabsContent>
      </Tabs>

      <StickyActionBar
        onRunIdeate={handleRunIdeate}
        onPushValidate={handlePushValidate}
        isRunning={isRunning}
      />
    </div>
  );
}
