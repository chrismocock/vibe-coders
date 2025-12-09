'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PillarGrid } from '@/components/validation/v2/PillarGrid';
import { AIProductOverviewPanel } from '@/components/validation/v2/AIProductOverviewPanel';
import { useValidationRefinement } from '@/components/validation/v2/useValidationRefinement';
import { SendToDesignBanner } from '@/components/validation/SendToDesignBanner';
import { IdeaSummaryCard } from '@/components/validation/v2/IdeaSummaryCard';
import { AIFocusSummary } from '@/components/validation/v2/AIFocusSummary';
import { Loader2, Sparkles } from 'lucide-react';

export default function ValidationRefinementPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const {
    loading,
    error,
    idea,
    pillars,
    overview,
    improving,
    lastSavedAt,
    debugLogs,
    improveIdea,
    updateOverview,
    validatedIdeaId,
    lastRefinedAt,
    sectionDiagnostics,
    autoSaveLabel,
    autoSaveStatus,
  } = useValidationRefinement(projectId);

  const averageScore = useMemo(() => {
    if (!pillars.length) return null;
    const total = pillars.reduce((sum, pillar) => sum + pillar.score, 0);
    return Math.round(total / pillars.length);
  }, [pillars]);

  const ideateHref = `/project/${projectId}/ideate`;

  const lastRefinedLabel = useMemo(() => {
    if (improving) return 'Refining now…';
    if (!lastRefinedAt) return 'Waiting for first refinement';

    const diffMs = Date.now() - lastRefinedAt;
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) {
      return `Last refined: ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Last refined: ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `Last refined: ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, [improving, lastRefinedAt]);

  if (loading && !idea) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-neutral-600">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="mt-3 text-sm">Getting your validation signals ready…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-2 pb-24 pt-6 sm:px-4 lg:px-6">
      <header className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Validation</p>
        <h1 className="text-3xl font-semibold text-neutral-900">AI Refinement Hub</h1>
        <p className="mt-2 max-w-3xl text-neutral-600">
          AI scores your idea across seven pillars, explains what needs work, and produces a ready-for-design Product Overview.
          One click, zero forms.
        </p>
        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </header>

      {!!debugLogs.length && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-600">Troubleshooting</p>
              <h3 className="text-lg font-semibold text-neutral-900">Recent validation errors</h3>
              <p className="text-sm text-neutral-700">
                These messages include save failures and AI issues to help you debug why refinement data is not persisting.
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-600">Latest {Math.min(debugLogs.length, 5)} events</span>
          </div>
          <div className="mt-4 space-y-3">
            {debugLogs
              .slice(-5)
              .reverse()
              .map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="rounded-2xl border border-amber-200 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{entry.message}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.details && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-neutral-900/90 p-3 text-xs text-neutral-100">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {idea && (
        <section className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <IdeaSummaryCard
            title={idea.title}
            overview={idea.summary}
            href={ideateHref}
          />
          <Card className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-purple-50/30 to-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Validation Snapshot</p>
            <p className="mt-1 text-sm text-neutral-600">AI reviewed your idea across 7 pillars.</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900">
                {averageScore !== null ? `${averageScore}` : '--'}
              </span>
              <span className="text-sm text-neutral-500">avg pillar score</span>
            </div>
          </Card>
        </section>
      )}

      <section className="rounded-3xl border border-neutral-100 bg-white/80 p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Diagnostics</p>
            <h2 className="text-2xl font-semibold text-neutral-900">7 Pillar Scorecard</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Colour-coded strengths and gaps help you see where AI will focus.
            </p>
          </div>
          {averageScore !== null && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-right text-sm text-neutral-600">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Avg Score</p>
              <span className="text-2xl font-semibold text-neutral-900">{averageScore}/10</span>
            </div>
          )}
        </div>
        <div className="mt-6">
          {pillars.length ? (
            <PillarGrid pillars={pillars} busy={improving} />
          ) : (
            <Card className="border border-dashed border-neutral-200 bg-white p-6 text-center text-neutral-500">
              Generating pillar diagnostics…
            </Card>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-500">Refinement</p>
            <h3 className="text-2xl font-semibold text-neutral-900">Refine My Idea with AI</h3>
            <p className="mt-1 text-sm text-neutral-600">
              AI uses the latest pillar diagnostics to rewrite your Product Overview.
            </p>
          </div>
          <Button
            onClick={improveIdea}
            disabled={improving || !pillars.length}
            size="lg"
            className="bg-purple-600 px-8 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-60"
          >
            {improving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refining…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Refine My Idea with AI
              </>
            )}
          </Button>
        </div>
      </section>

      {!!pillars.length && (
        <AIFocusSummary pillars={pillars} />
      )}

      <section className="space-y-5 rounded-3xl border border-neutral-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">AI Product Overview</p>
            <h2 className="text-3xl font-semibold text-neutral-900">Design-ready Product Overview</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This is the improved version of your idea. The Design stage uses this as the blueprint.
            </p>
            <p className="mt-3 text-xs font-medium text-neutral-500">{lastRefinedLabel}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
              <span className="text-sm font-medium text-neutral-800">✏️ Edit Sections</span>
              <Switch checked={isEditingOverview} onCheckedChange={setIsEditingOverview} />
            </div>
          </div>
        </div>
        <AIProductOverviewPanel
          overview={overview}
          onChange={updateOverview}
          isEditing={isEditingOverview}
          improving={improving}
          sectionDiagnostics={sectionDiagnostics}
          autoSaveStatus={autoSaveStatus}
          autoSaveLabel={autoSaveLabel}
          lastSavedAt={lastSavedAt}
        />
      </section>

      {overview && (
        <div className="sticky bottom-4 z-20">
          <SendToDesignBanner projectId={projectId} validatedIdeaId={validatedIdeaId} />
        </div>
      )}
    </div>
  );
}
