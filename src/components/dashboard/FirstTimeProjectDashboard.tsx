"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Sparkles,
  Navigation,
  MessageCircle,
  Lightbulb,
} from "lucide-react";

const JOURNEY_STAGES = [
  { id: "ideate", label: "Ideate", description: "Shape your core idea" },
  { id: "validate", label: "Validate", description: "Prove the opportunity" },
  { id: "design", label: "Design", description: "Blueprint the solution" },
  { id: "build", label: "Build", description: "Develop your MVP" },
  { id: "launch", label: "Launch", description: "Go to market" },
  { id: "monetise", label: "Monetise", description: "Grow revenue" },
];

interface FirstTimeProjectDashboardProps {
  projectId: string;
  projectTitle: string;
  projectSummary?: string;
  logoUrl?: string | null;
}

export default function FirstTimeProjectDashboard({
  projectId,
  projectTitle,
  projectSummary,
  logoUrl,
}: FirstTimeProjectDashboardProps) {
  const projectInitial = useMemo(() => {
    if (!projectTitle || projectTitle === "Untitled Project") return "?";
    return projectTitle.charAt(0).toUpperCase();
  }, [projectTitle]);

  const summaryText =
    projectSummary ||
    "No description yet. Start Ideate to articulate your idea, audience, and the problem you are solving.";

  const ideateHref = `/project/${projectId}/ideate`;
  const wizardHref = `${ideateHref}?mode=wizard`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Welcome aboard</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              🚀 Let&apos;s Bring Your Idea to Life
            </h1>
            <p className="mt-3 text-lg text-white/80 max-w-3xl">
              Start with Ideate — Kooio will guide you step-by-step to shape your idea with clarity,
              confidence, and momentum.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="bg-white text-purple-700 hover:bg-white/90 shadow-lg animate-pulse rounded-full px-8 py-6 text-base font-semibold"
            >
              <Link href={ideateHref}>Start Ideating</Link>
            </Button>
            <Button
              asChild
              variant="link"
              className="text-white/90 hover:text-white underline-offset-4"
            >
              <Link href="#journey-timeline">Explore the journey</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section id="journey-timeline" className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            The Journey
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            6 stages to launch and monetise your idea
          </h2>
          <p className="text-sm text-neutral-600">
            You&apos;re at the starting line. Let&apos;s make Ideate sing before unlocking the rest.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
            {JOURNEY_STAGES.map((stage, index) => {
              const isActive = stage.id === "ideate";
              const isLast = index === JOURNEY_STAGES.length - 1;
              const content = (
                <>
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-semibold",
                      isActive
                        ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-200 animate-[pulse_2.5s_ease-in-out_infinite]"
                        : "border-dashed border-neutral-300"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="mt-3 text-sm font-semibold uppercase tracking-wide">
                    {stage.label}
                  </span>
                  <span className="mt-1 text-xs text-neutral-500 max-w-[8rem]">
                    {stage.description}
                  </span>
                </>
              );

              return (
                <div key={stage.id} className="flex items-center">
                  {isActive ? (
                    <Link
                      href={ideateHref}
                      className="flex flex-col items-center text-center text-purple-600 transition-all hover:scale-[1.02]"
                      title="Start Ideating"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="flex flex-col items-center text-center text-neutral-400 cursor-not-allowed"
                      title="Available after Ideate"
                    >
                      {content}
                    </div>
                  )}
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

      {/* Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="group border border-purple-100 bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-purple-700">
              <Navigation className="h-5 w-5" />
              🧭 Quick Start Wizard
            </CardTitle>
            <CardDescription>
              Begin by answering a few guided questions to give your idea clarity and direction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full bg-purple-600 text-white hover:bg-purple-700">
              <Link href={wizardHref}>Start Quick Wizard</Link>
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
            <p>Great ideas start with clarity. Let’s shape yours together.</p>
            <Button variant="outline" asChild className="rounded-full border-amber-300 text-amber-900 hover:bg-amber-100">
              <Link href={ideateHref}>Start Ideate</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Project info */}
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Project Snapshot
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
                <p className="text-sm text-neutral-500">Your journey starts with Ideate.</p>
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


