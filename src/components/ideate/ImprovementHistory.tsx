'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductOverview } from '@/server/ideate/refinementEngine';

export interface SectionDiff {
  section: string;
  before: string;
  after: string;
}

export interface ImprovementHistoryEntry {
  id?: string;
  pillar: string;
  scoreDelta?: number | null;
  differences: SectionDiff[];
  beforeSection?: string;
  afterSection?: string;
  improvedOverview?: ProductOverview | null;
  createdAt: string;
  source?: 'manual' | 'auto';
}

interface ImprovementHistoryProps {
  entries: ImprovementHistoryEntry[];
  autoImproving?: boolean;
  targetScore?: number;
  currentConfidence?: number | null;
  onApply?: (entry: ImprovementHistoryEntry) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export function ImprovementHistory({
  entries,
  autoImproving = false,
  targetScore = 95,
  currentConfidence,
  onApply,
  onUndo,
  canUndo = false,
}: ImprovementHistoryProps) {
  const hasEntries = entries.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Improvement History</h4>
          <p className="text-xs text-neutral-600">
            {autoImproving ? 'Auto-improve is iterating live.' : 'Before/after diffs for each rewrite.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeof currentConfidence === 'number' && (
            <span className="text-xs text-neutral-500">
              {currentConfidence}% → Target {targetScore}%
            </span>
          )}
          {onUndo && (
            <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
              Undo last improvement
            </Button>
          )}
        </div>
      </div>

      {autoImproving && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
          Auto-improving toward {targetScore}%…
        </div>
      )}

      {!hasEntries ? (
        <p className="text-sm text-neutral-600">No improvements yet. Start with an individual pillar or auto-improve.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const key = entry.id ?? `${entry.pillar}-${entry.createdAt}`;
            const badgeClasses = cn(
              'rounded-full px-2 py-0.5 text-xs border',
              (entry.scoreDelta ?? 0) >= 0
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200',
            );

            const scoreLabel =
              typeof entry.scoreDelta === 'number' && entry.scoreDelta !== 0
                ? `${entry.scoreDelta > 0 ? '+' : ''}${entry.scoreDelta} score`
                : null;

            return (
              <div key={key} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{entry.pillar}</span>
                    {scoreLabel && <span className={badgeClasses}>{scoreLabel}</span>}
                    {entry.source === 'auto' && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">Auto</span>
                    )}
                    <span className="text-xs text-neutral-500">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {onApply && entry.improvedOverview && (
                    <Button size="sm" variant="secondary" onClick={() => onApply(entry)}>
                      Apply improvement
                    </Button>
                  )}
                </div>

                {entry.differences?.length ? (
                  <div className="mt-2 space-y-2">
                    {entry.differences.map((diff, diffIndex) => (
                      <details key={`${key}-${diffIndex}`} className="rounded border border-neutral-100 bg-neutral-50 p-2 text-sm">
                        <summary className="cursor-pointer text-neutral-800">{diff.section}</summary>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <div className="rounded bg-white p-2 text-xs text-neutral-700">
                            <div className="font-semibold text-neutral-900">Before</div>
                            <p className="whitespace-pre-wrap">{diff.before || '—'}</p>
                          </div>
                          <div className="rounded bg-white p-2 text-xs text-neutral-700">
                            <div className="font-semibold text-neutral-900">After</div>
                            <p className="whitespace-pre-wrap">{diff.after || '—'}</p>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  (entry.beforeSection || entry.afterSection) && (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded border border-dashed border-neutral-200 p-2 text-xs text-neutral-700">
                        <div className="font-semibold text-neutral-900">Before</div>
                        <p className="whitespace-pre-wrap">{entry.beforeSection || '—'}</p>
                      </div>
                      <div className="rounded border border-dashed border-neutral-200 p-2 text-xs text-neutral-700">
                        <div className="font-semibold text-neutral-900">After</div>
                        <p className="whitespace-pre-wrap">{entry.afterSection || '—'}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
