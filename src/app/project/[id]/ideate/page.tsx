"use client";

import { useMemo, useState } from "react";
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

export type PillarSnapshot = {
  id: string;
  name: string;
  score: number;
  delta: number;
  summary: string;
  opportunities: string[];
  risks: string[];
};

export type Suggestion = {
  id: string;
  pillarId?: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  applied: boolean;
};

export type Experiment = {
  id: string;
  name: string;
  goal: string;
  owner: string;
  startDate: string;
  status: "draft" | "validating" | "scheduled";
};

export type IdeateRun = {
  id: string;
  headline: string;
  narrative: string;
  lastRunAt: string;
  quickTakes: { label: string; value: string; delta?: string }[];
  risks: string[];
  opportunities: string[];
};

const mockRun: IdeateRun = {
  id: "run-001",
  headline: "Boost conversion on the self-serve onboarding funnel",
  narrative:
    "You want to increase activation for workspace admins by clarifying value, reducing friction, and creating a more compelling first project path.",
  lastRunAt: "2024-06-02T10:00:00Z",
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
};

const mockPillars: PillarSnapshot[] = [
  {
    id: "audience",
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
    name: "Competition",
    score: 7.0,
    delta: 0.4,
    summary: "Differentiation clearer via automations; pricing parity still a question.",
    opportunities: ["Highlight automation library vs competitors."],
    risks: ["Comparisons may invite price discounting conversations."],
  },
  {
    id: "feasibility",
    name: "Feasibility",
    score: 7.2,
    delta: -0.3,
    summary: "Engineering confident in guided setup but needs analytics support for experiments.",
    opportunities: ["Bundle instrumentation tasks into sprint 1."],
    risks: ["Analytics resourcing could delay testing windows."],
  },
];

const mockSuggestions: Suggestion[] = [
  {
    id: "s1",
    pillarId: "audience",
    title: "Guided onboarding presets",
    description: "Auto-create first project templates based on persona and goal to reach activation faster.",
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
];

const mockExperiments: Experiment[] = [
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
];

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
  const { id } = useParams<{ id: string }>();
  const [isRunning, setIsRunning] = useState(false);
  const [hasPushed, setHasPushed] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);

  const activeSummary = useMemo(
    () => `Iteration ${mockRun.id} • Updated ${new Date(mockRun.lastRunAt).toLocaleDateString()}`,
    []
  );

  const snapshotSummary =
    "AI recommends leading with guided onboarding, clear admin value, and tighter analytics guardrails.";
  const pillarsSummary =
    "Confidence improving across pillars; audience fit leads momentum and feasibility needs analytics support.";
  const planSummary =
    "Seven-day plan is queued; experiments are ready to validate with analytics owners on deck.";

  const handleRunIdeate = () => {
    setIsRunning(true);
    toast.loading("Running ideate across pillars...", { id: "run-ideate" });
    setTimeout(() => {
      setIsRunning(false);
      toast.success("New ideation complete", { id: "run-ideate" });
    }, 1200);
  };

  const handlePushValidate = () => {
    setHasPushed(true);
    toast.success("Handed off to Validate with latest plan.");
  };

  const handleApply = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, applied: true } : s))
    );
    toast.success("Applied to backlog");
  };

  const handleSendExperiment = (id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, status: "validating" } : exp
      )
    );
    toast.success("Sent to Validate");
  };

  const handleRefreshPillars = () => {
    toast.info("Re-running pillar scoring with fresh signals...");
  };

  const handleRefreshPlan = () => {
    toast.info("Regenerating 7-day plan...");
  };

  return (
    <div className="space-y-6 pb-20">
      <IdeateHeader
        projectId={id}
        headline={mockRun.headline}
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
            analysis={mockRun.narrative}
            quickMetrics={mockRun.quickTakes}
          />

          <QuickTakeGrid items={mockRun.quickTakes} />

          <div className="grid gap-4 md:grid-cols-2">
            <RisksOpportunities
              risks={mockRun.risks}
              opportunities={mockRun.opportunities}
            />
            <MetricsCard title="Momentum" value="Trending up" badge="Live" />
          </div>

          <BestImprovementsList
            items={suggestions}
            onApply={handleApply}
            onGenerate={() => toast.info("Generating updated recommendations...")}
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
              <Button variant="outline" size="sm" onClick={handleRefreshPillars}>
                Refresh pillars
              </Button>
            </CardHeader>
          </Card>
          <PillarSummaryStrip pillars={mockPillars} />
          <PillarAccordion
            pillars={mockPillars}
            suggestions={suggestions}
            onApply={handleApply}
            onGenerate={() => toast.info("Refreshing pillar guidance...")}
          />
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Plan summary</CardTitle>
                <p className="text-sm text-muted-foreground">{planSummary}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshPlan}>
                Regenerate plan
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
                <Badge variant="secondary">2 running</Badge>
              </div>
              <ExperimentsTable
                items={experiments}
                onSend={handleSendExperiment}
              />
            </CardContent>
          </Card>

          <ValidateHandoffPanel
            hasPushed={hasPushed}
            onPush={handlePushValidate}
          />

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
