'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationOverviewHeroProps {
  score: number;
  recommendation: 'build' | 'revise' | 'drop';
  completedCount: number;
  totalCount: number;
  strongSections: number;
}

const recommendationConfig = {
  build: {
    label: 'Build',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Strong validation across all dimensions. Proceed with confidence!',
  },
  revise: {
    label: 'Revise',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Good potential, but some areas need refinement before building.',
  },
  drop: {
    label: 'Drop',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Significant concerns identified. Consider pivoting or exploring alternatives.',
  },
};

export function ValidationOverviewHero({
  score,
  recommendation,
  completedCount,
  totalCount,
  strongSections,
}: ValidationOverviewHeroProps) {
  const recConfig = recommendationConfig[recommendation];
  const RecIcon = recConfig.icon;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-2', recConfig.borderColor, recConfig.bgColor)}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Recommendation */}
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-lg', recConfig.bgColor, recConfig.borderColor, 'border')}>
              <RecIcon className={cn('h-8 w-8', recConfig.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-neutral-900">Recommendation: {recConfig.label}</h2>
              </div>
              <p className="text-sm text-neutral-700">{recConfig.description}</p>
            </div>
          </div>

          {/* Right: Score and Stats */}
          <div className="flex flex-col md:items-end gap-4">
            {/* Overall Score */}
            <div className="text-center md:text-right">
              <div className="text-5xl font-bold text-neutral-900 mb-1">{score}</div>
              <div className="text-sm text-neutral-600">Overall Score</div>
              <Progress value={score} className={cn('h-3 mt-2 w-32 md:w-40', getScoreColor(score))} />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{completedCount}/{totalCount}</div>
                <div className="text-xs text-neutral-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{strongSections}</div>
                <div className="text-xs text-neutral-600">Strong (70+)</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

