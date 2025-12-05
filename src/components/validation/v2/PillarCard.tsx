"use client";

import { ValidationPillarId, ValidationPillarResult } from "@/server/validation/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, Circle, ShieldCheck } from "lucide-react";
import { PillarSkeleton } from "@/components/ui/skeleton";

interface PillarCardProps {
  pillar: ValidationPillarResult;
  busy?: boolean;
}

const PILLAR_GLOSSARY: Record<ValidationPillarId, string> = {
  audienceFit: "Audience Fit measures how well the idea resonates with the intended users.",
  problemClarity: "Problem Clarity captures how clearly the core pain point is articulated.",
  solutionStrength: "Solution Strength evaluates how effectively the concept solves the problem.",
  competition: "Competition reviews differentiation and defensibility against alternatives.",
  marketSize: "Market Size looks at the scale and urgency of the opportunity.",
  feasibility: "Feasibility covers technical build complexity and delivery risk.",
  monetisation: "Monetisation examines pricing power and revenue potential.",
};

const scoreTokens = (score: number) => {
  if (score >= 8) {
    return {
      label: "Strong",
      badgeClass: "bg-emerald-100 text-emerald-800",
      cardClass: "border-emerald-100 bg-emerald-50/70 ring-1 ring-emerald-100/80",
      iconWrap: "bg-emerald-100 text-emerald-600",
      Icon: ShieldCheck,
    };
  }
  if (score >= 5) {
    return {
      label: "Decent",
      badgeClass: "bg-amber-100 text-amber-800",
      cardClass: "border-amber-100 bg-amber-50/70 ring-1 ring-amber-100/80",
      iconWrap: "bg-amber-100 text-amber-600",
      Icon: Circle,
    };
  }
  return {
    label: "Needs Work",
    badgeClass: "bg-rose-100 text-rose-800",
      cardClass: "border-rose-100 bg-rose-50/70 ring-1 ring-rose-100/80",
      iconWrap: "bg-rose-100 text-rose-600",
    Icon: AlertTriangle,
  };
};

export function PillarCard({ pillar, busy }: PillarCardProps) {
  if (busy) {
    return <PillarSkeleton />;
  }

  const { label, badgeClass, cardClass, iconWrap, Icon } = scoreTokens(pillar.score);
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-l-4 p-4 shadow-sm transition-transform hover:-translate-y-0.5",
        cardClass,
        pillar.score >= 8
          ? "border-l-emerald-400"
          : pillar.score >= 5
            ? "border-l-amber-400"
            : "border-l-rose-400",
      )}
      title={PILLAR_GLOSSARY[pillar.pillarId]}
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("rounded-full p-2", iconWrap)}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Pillar</p>
            <h3 className="text-base font-semibold text-neutral-900">{pillar.pillarName}</h3>
          </div>
        </div>
        <div className="text-right">
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold", badgeClass)}>{label}</Badge>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{pillar.score}/10</p>
        </div>
      </div>
      <div className="relative mt-3">
        <Progress value={(pillar.score / 10) * 100} className="h-1.5 bg-white/40" />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div>
          <p className="font-medium text-neutral-700">Analysis</p>
          <p className="text-neutral-600">{pillar.analysis}</p>
        </div>
        <div>
          <p className="font-medium text-neutral-700">Strength</p>
          <p className="text-neutral-600">{pillar.strength}</p>
        </div>
        <div>
          <p className="font-medium text-neutral-700">Weakness</p>
          <p className="text-neutral-600">{pillar.weakness}</p>
        </div>
        <div>
          <p className="font-medium text-neutral-700">Improve</p>
          <p className="text-neutral-900">{pillar.improvementSuggestion}</p>
        </div>
      </div>
    </Card>
  );
}


