"use client";

import { ValidationPillarId, ValidationPillarResult } from "@/server/validation/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, Circle, ShieldCheck } from "lucide-react";

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
      cardClass: "border-emerald-200 bg-emerald-50/60",
      iconWrap: "bg-emerald-100 text-emerald-600",
      Icon: ShieldCheck,
    };
  }
  if (score >= 5) {
    return {
      label: "Decent",
      badgeClass: "bg-amber-100 text-amber-800",
      cardClass: "border-amber-200 bg-amber-50/60",
      iconWrap: "bg-amber-100 text-amber-600",
      Icon: Circle,
    };
  }
  return {
    label: "Needs Work",
    badgeClass: "bg-rose-100 text-rose-800",
    cardClass: "border-rose-200 bg-rose-50/60",
    iconWrap: "bg-rose-100 text-rose-600",
    Icon: AlertTriangle,
  };
};

export function PillarCard({ pillar, busy }: PillarCardProps) {
  const { label, badgeClass, cardClass, iconWrap, Icon } = scoreTokens(pillar.score);
  return (
    <Card className={cn("relative overflow-hidden p-4 shadow-sm", cardClass)} title={PILLAR_GLOSSARY[pillar.pillarId]}>
      {busy && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-white/65 backdrop-blur-[1px]" />
          <div className="shimmer-line" />
        </div>
      )}
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


