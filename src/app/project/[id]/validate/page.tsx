'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PillarGrid } from '@/components/validation/v2/PillarGrid';
import { AIProductOverviewPanel } from '@/components/validation/v2/AIProductOverviewPanel';
import { useValidationRefinement } from '@/components/validation/v2/useValidationRefinement';
import { SendToDesignBanner } from '@/components/validation/SendToDesignBanner';
import { Loader2, Sparkles } from 'lucide-react';

const pillarBadgeClass = (score: number) => {
  if (score >= 8) return 'bg-emerald-50 text-emerald-700';
  if (score >= 5) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
};

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
    saving,
    saveError,
    lastSavedAt,
    improveIdea,
    updateOverview,
    validatedIdeaId,
  } = useValidationRefinement(projectId);

  const averageScore = useMemo(() => {
    if (!pillars.length) return null;
    const total = pillars.reduce((sum, pillar) => sum + pillar.score, 0);
    return Math.round(total / pillars.length);
  }, [pillars]);

  const ideateHref = `/project/${projectId}/ideate`;

  const ideaPitch = useMemo(() => {
    if (!idea?.summary) return null;
    const sentences = idea.summary
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    return sentences.slice(0, 2).join(' ');
  }, [idea?.summary]);

  const focusedPillars = useMemo(
    () => pillars.filter((pillar) => pillar.score < 7),
    [pillars],
  );

  const autoSaveLabel = useMemo(() => {
    if (saving) return 'Saving…';
    if (saveError) return 'Error saving – retrying…';
    if (lastSavedAt) return '✓ Auto-saved';
    return 'Not saved yet';
  }, [lastSavedAt, saveError, saving]);

  if (loading && !idea) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-neutral-600">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="mt-3 text-sm">Getting your validation signals ready…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
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

      {idea && (
        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Card className="border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Idea Summary</p>
            <h3 className="mt-2 text-xl font-semibold text-neutral-900">{idea.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">
              {ideaPitch || 'No summary captured yet.'}
            </p>
            <Link
              href={ideateHref}
              className="mt-3 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              View full idea →
            </Link>
          </Card>
          <Card className="border border-neutral-200 bg-white p-5 shadow-sm">
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Diagnostics</p>
            <h2 className="text-xl font-semibold text-neutral-900">7 Pillar Scorecard</h2>
          </div>
        </div>
        {pillars.length ? (
          <PillarGrid pillars={pillars} busy={improving} />
        ) : (
          <Card className="border border-dashed border-neutral-200 bg-white p-6 text-center text-neutral-500">
            Generating pillar diagnostics…
          </Card>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-purple-200 bg-white/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-neutral-900">Refine My Idea with AI</h3>
            <p className="mt-1 text-sm text-neutral-600">
              AI will improve your idea using all 7 pillar diagnostics.
            </p>
          </div>
          <Button
            onClick={improveIdea}
            disabled={improving || !pillars.length}
            size="lg"
            className="bg-purple-600 px-8 text-white hover:bg-purple-700 disabled:opacity-60"
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
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-neutral-800">AI focused improvements on:</p>
            <div className="flex flex-wrap gap-2">
              {focusedPillars.length ? (
                focusedPillars.map((pillar) => (
                  <Badge key={pillar.pillarId} className={pillarBadgeClass(pillar.score)}>
                    {pillar.pillarName}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  All pillars strong
                </Badge>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">AI Product Overview</p>
            <h2 className="text-2xl font-semibold text-neutral-900">AI Product Overview (Design-ready Brief)</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This is the improved version of your idea. The Design stage uses this as the blueprint.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-800">Edit Sections</span>
              <Switch checked={isEditingOverview} onCheckedChange={setIsEditingOverview} />
            </div>
            <span className="text-xs text-neutral-500">{autoSaveLabel}</span>
          </div>
        </div>
        <AIProductOverviewPanel
          overview={overview}
          onChange={updateOverview}
          isEditing={isEditingOverview}
          improving={improving}
        />
      </section>

      {overview && (
        <SendToDesignBanner projectId={projectId} validatedIdeaId={validatedIdeaId} />
      )}
    </div>
  );
}
