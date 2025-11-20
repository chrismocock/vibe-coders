'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SectionData } from './useAllSectionsData';

interface ScoreBreakdownChartProps {
  sections: SectionData[];
}

export function ScoreBreakdownChart({ sections }: ScoreBreakdownChartProps) {
  const completedSections = sections.filter((s) => s.isCompleted && s.result);

  if (completedSections.length === 0) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 text-center py-8">
            Complete validation sections to see score breakdown
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Sort by score (highest first)
  const sortedSections = [...completedSections].sort(
    (a, b) => (b.result?.score ?? 0) - (a.result?.score ?? 0)
  );

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSections.map((section) => {
            const score = section.result?.score ?? 0;
            return (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{section.label}</span>
                  <span className="text-sm font-semibold text-neutral-900">{score}/100</span>
                </div>
                <Progress 
                  value={score} 
                  className={cn('h-2.5', getScoreColor(score))} 
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

