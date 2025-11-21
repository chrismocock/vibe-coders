"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { STAGE_ORDER, STAGE_LABELS, StageId } from "@/lib/stageMetadata";
import { Navigation, Sparkles } from "lucide-react";

type StageStatus = "pending" | "in_progress" | "completed";

interface StageRecord {
  status?: StageStatus;
}

interface ProjectProgressDashboardProps {
  projectId: string;
  projectTitle: string;
  projectSummary?: string;
  logoUrl?: string | null;
  stageData?: Record<string, StageRecord | undefined>;
}

const JOURNEY_STAGE_IDS = STAGE_ORDER.filter((stageId) => stageId !== "dashboard");
const DEFAULT_SUMMARY =
  "No description yet. Progress through the journey to craft a compelling story for your product.";

const statusLabelMap: Record<StageStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Not started",
};

const getStageRoute = (projectId: string, stageId: string) => `/project/${projectId}/${stageId}`;

export default function ProjectProgressDashboard({
  projectId,
  projectTitle,
  projectSummary,
  logoUrl,
  stageData,
}: ProjectProgressDashboardProps) {
  const projectInitial = useMemo(() => {
    if (!projectTitle || projectTitle === "Untitled Project") return "?";
    return projectTitle.charAt(0).toUpperCase();
  }, [projectTitle]);

  const summaryText = projectSummary || DEFAULT_SUMMARY;

  const stageStatusMap = useMemo(() => {
    return JOURNEY_STAGE_IDS.reduce<Record<string, StageStatus>>((acc, stageId) => {
      const rawStatus = stageData?.[stageId]?.status;
      if (rawStatus === "completed" || rawStatus === "in_progress") {
        acc[stageId] = rawStatus;
      } else {
        acc[stageId] = "pending";
      }
      return acc;
    }, {});
  }, [stageData]);

  const completedCount = JOURNEY_STAGE_IDS.filter(
    (stageId) => stageStatusMap[stageId] === "completed"
  ).length;
  const inProgressCount = JOURNEY_STAGE_IDS.filter(
    (stageId) => stageStatusMap[stageId] === "in_progress"
  ).length;
  const completionPercent = Math.round((completedCount / JOURNEY_STAGE_IDS.length) * 100);

  const nextStageId =
    JOURNEY_STAGE_IDS.find((stageId) => stageStatusMap[stageId] !== "completed") ??
    JOURNEY_STAGE_IDS[JOURNEY_STAGE_IDS.length - 1];
  const nextStageLabel = STAGE_LABELS[nextStageId as StageId];
  const nextStageStatus = stageStatusMap[nextStageId];
  const isJourneyComplete = completedCount === JOURNEY_STAGE_IDS.length;

  const heroCtaLabel = isJourneyComplete
    ? "Review journey"
    : nextStageStatus === "in_progress"
    ? `Continue ${nextStageLabel}`
    : `Start ${nextStageLabel}`;

  const heroCtaHref = isJourneyComplete
    ? getStageRoute(projectId, JOURNEY_STAGE_IDS[JOURNEY_STAGE_IDS.length - 1])
    : getStageRoute(projectId, nextStageId);

  const heroSubtitle = isJourneyComplete
    ? "Amazing! You’ve completed every stage. Revisit any step to iterate or celebrate your launch."
    : `Next up: ${nextStageLabel}. Keep momentum by moving into the ${nextStageLabel} stage.`;

  const heroBadgeText = `${completedCount}/${JOURNEY_STAGE_IDS.length} stages completed`;

  const isStageUnlocked = (stageId: string) => {
    const index = JOURNEY_STAGE_IDS.indexOf(stageId);
    if (index <= 0) return true;
    return JOURNEY_STAGE_IDS.slice(0, index).every(
      (prevStageId) => stageStatusMap[prevStageId] === "completed"
    );
  };

  const getStatusLabel = (stageId: string, status: StageStatus, unlocked: boolean) => {
    if (status === "pending") {
      return unlocked ? "Ready" : "Locked";
    }
    return statusLabelMap[status];
  };

  const ideateHref = getStageRoute(projectId, "ideate");
  const wizardHref = `${ideateHref}?mode=wizard`;
  const quickWizardCompleted = stageStatusMap["ideate"] === "completed";
  const quickWizardCtaLabel = quickWizardCompleted ? "Review Ideate" : "Start Quick Wizard";
  const quickWizardDescription = quickWizardCompleted
    ? "Revisit your original thinking or iterate with new insights."
    : "Begin by answering a few guided questions to give your idea clarity and direction.";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Project Progress</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Keep momentum across every stage
            </h1>
            <p className="mt-3 text-lg text-white/80 max-w-3xl">{heroSubtitle}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className={cn(
                "rounded-full px-8 py-6 text-base font-semibold text-purple-700 shadow-lg",
                isJourneyComplete ? "bg-white hover:bg-white/90" : "bg-white animate-pulse hover:bg-white/90"
              )}
            >
              <Link href={heroCtaHref}>{heroCtaLabel}</Link>
            </Button>
            <Button
              asChild
              variant="link"
              className="text-white/90 hover:text-white underline-offset-4"
            >
              <Link href="#journey-timeline">Explore the journey</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="rounded-full bg-white/10 px-4 py-1 font-medium">{heroBadgeText}</span>
            <span>Overall progress: {completionPercent}%</span>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section
        id="journey-timeline"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Journey overview
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Track each stage and stay focused
          </h2>
          <p className="text-sm text-neutral-600">
            {isJourneyComplete
              ? "Every stage is complete. Jump into any step to refine it."
              : `You are currently focused on ${nextStageLabel}. Complete stages sequentially to unlock the next milestone.`}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
            {JOURNEY_STAGE_IDS.map((stageId, index) => {
              const status = stageStatusMap[stageId];
              const unlocked = isStageUnlocked(stageId);
              const stageLabel = STAGE_LABELS[stageId as StageId];
              const stageHref = getStageRoute(projectId, stageId);
              const isLast = index === JOURNEY_STAGE_IDS.length - 1;
              const isActive = !isJourneyComplete && stageId === nextStageId;
              const Wrapper = unlocked ? Link : "div";

              const content = (
                <>
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-semibold transition-all",
                      status === "completed" && "border-green-500 bg-green-50 text-green-700 shadow",
                      status === "in_progress" &&
                        "border-purple-500 bg-purple-50 text-purple-700 animate-[pulse_2s_ease-in-out_infinite]",
                      status === "pending" &&
                        (unlocked
                          ? "border-dashed border-neutral-300 text-neutral-600"
                          : "border-dashed border-neutral-200 text-neutral-400 opacity-70")
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="mt-3 text-sm font-semibold uppercase tracking-wide text-neutral-900">
                    {stageLabel}
                  </span>
                  <span
                    className={cn(
                      "mt-2 rounded-full px-2 py-0.5 text-xs font-medium",
                      status === "completed" && "bg-green-100 text-green-700",
                      status === "in_progress" && "bg-purple-100 text-purple-700",
                      status === "pending" && unlocked && "bg-neutral-100 text-neutral-600",
                      status === "pending" && !unlocked && "bg-neutral-50 text-neutral-400"
                    )}
                  >
                    {getStatusLabel(stageId, status, unlocked)}
                  </span>
                </>
              );

              return (
                <div key={stageId} className="flex items-center">
                  <Wrapper
                    {...(unlocked ? { href: stageHref } : {})}
                    className={cn(
                      "flex flex-col items-center text-center transition-all",
                      unlocked ? "text-neutral-800 hover:scale-[1.02]" : "text-neutral-400 cursor-not-allowed",
                      isActive && "text-purple-700"
                    )}
                    title={
                      unlocked
                        ? `Open the ${stageLabel} stage`
                        : "Complete the previous stage to unlock this step"
                    }
                  >
                    {content}
                  </Wrapper>
                  {!isLast && (
                    <div className="mx-3 hidden flex-1 items-center md:flex">
                      <div className="h-px w-full bg-neutral-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guidance cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="group border border-purple-100 bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-purple-700">
              <Navigation className="h-5 w-5" />
              🧭 Quick Start Wizard
            </CardTitle>
            <CardDescription>{quickWizardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full bg-purple-600 text-white hover:bg-purple-700">
              <Link href={wizardHref}>{quickWizardCtaLabel}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-amber-50/80 shadow-inner">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <Sparkles className="h-5 w-5" />
              🤖 Kooio Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-amber-900">
            <p>
              Great ideas start with clarity. Kooio keeps you focused on the most impactful next step.
            </p>
            <Button
              variant="outline"
              asChild
              className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              <Link href={heroCtaHref}>{heroCtaLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Progress snapshot */}
      <Card className="border border-emerald-100 bg-emerald-50/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-emerald-900">Progress snapshot</CardTitle>
          <CardDescription className="text-emerald-900/80">
            Monitor how far you’ve come and what’s left to unlock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
              <span>Overall completion</span>
              <span>{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="mt-2 h-3 bg-white/60" />
          </div>
          <div className="grid gap-4 text-center text-sm text-emerald-900 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p>Completed stages</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <p>In progress</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {JOURNEY_STAGE_IDS.length - completedCount}
              </div>
              <p>Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project info */}
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Project snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-2xl font-bold text-purple-600 shadow-inner">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${projectTitle} logo`}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  projectInitial
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-neutral-500">Project</p>
                <p className="text-xl font-semibold text-neutral-900">{projectTitle}</p>
                <p className="text-sm text-neutral-500">
                  Keep this snapshot handy as you move between stages.
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-4 text-sm text-neutral-700">
              {summaryText}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


