'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OpportunityScore } from '@/server/validation/types';
import { cn } from '@/lib/utils';

interface OpportunityScoreCardProps {
  score: OpportunityScore | null;
}

function scoreColor(value: number) {
  if (value >= 70) return 'bg-green-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function OpportunityScoreCard({ score }: OpportunityScoreCardProps) {
  if (!score) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Opportunity Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">Run validation to see AI-calculated opportunity momentum.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Opportunity Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-4xl font-bold text-neutral-900">{score.score}</div>
            <p className="text-sm text-neutral-600">Composite momentum across market, audience, and feasibility</p>
          </div>
          <Progress value={score.score} className={cn('h-3 md:w-48', scoreColor(score.score))} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <BreakdownPill label="Market Momentum" value={score.breakdown.marketMomentum} />
          <BreakdownPill label="Audience Enthusiasm" value={score.breakdown.audienceEnthusiasm} />
          <BreakdownPill label="Feasibility" value={score.breakdown.feasibility} />
        </div>

        <p className="text-sm text-neutral-700 leading-relaxed">{score.rationale}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-neutral-900">{value}</div>
      <Progress value={value} className={cn('mt-2 h-2', scoreColor(value))} />
    </div>
  );
}


