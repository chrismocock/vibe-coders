'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ValidationPillarResult } from '@/server/validation/types';

interface AIFocusSummaryProps {
  pillars: ValidationPillarResult[];
  threshold?: number;
  className?: string;
}

export function AIFocusSummary({ pillars, threshold = 7, className }: AIFocusSummaryProps) {
  const focusPillars = useMemo(
    () => pillars.filter((pillar) => pillar.score < threshold),
    [pillars, threshold],
  );

  if (!pillars.length) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-purple-100 bg-gradient-to-r from-white via-purple-50 to-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-sm text-neutral-700">
        <span className="rounded-full bg-purple-100 p-2 text-purple-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="font-medium text-neutral-900">AI focus summary</p>
      </div>
      {focusPillars.length ? (
        <div className="flex flex-wrap gap-2 text-sm text-neutral-700">
          <span className="text-neutral-600">AI focused your refinement on:</span>
          {focusPillars.map((pillar) => (
            <Badge
              key={pillar.pillarId}
              variant="secondary"
              className="rounded-full bg-white/80 text-sm font-medium text-neutral-800 shadow-sm"
            >
              {pillar.pillarName}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-emerald-700">All pillars scoring 7+ — AI kept everything sharp.</p>
      )}
    </div>
  );
}

