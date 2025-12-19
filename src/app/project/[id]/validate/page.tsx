'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PillarGrid } from '@/components/validation/v2/PillarGrid';
import { AIFocusSummary } from '@/components/validation/v2/AIFocusSummary';
import { toast } from 'sonner';
import { useProjectStages } from '@/hooks/useProjectStages';
import { extractIdeaDetails, type IdeaDetails } from '@/server/validation/idea';
import type { ValidationReportRow } from '@/server/validation/store';
import type {
  FeatureMap,
  Persona,
  RiskRadar,
  SectionResult,
  ValidationPillarId,
  ValidationPillarResult,
  ValidationReport,
} from '@/server/validation/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';

type ReportSectionKey =
  | 'overview'
  | 'problem'
  | 'market'
  | 'competition'
  | 'audience'
  | 'feasibility'
  | 'pricing'
  | 'go-to-market';

const SECTION_CARDS: Array<{
  id: ReportSectionKey;
  label: string;
  description: string;
}> = [
  { id: 'problem', label: 'Problem Validation', description: 'Test severity, urgency, and evidence of the core pain.' },
  { id: 'market', label: 'Market Insights', description: 'Size, demand signals, and where momentum is building.' },
  { id: 'competition', label: 'Competitive Angle', description: 'How you stack up and the gaps you can own.' },
  { id: 'audience', label: 'Audience Fit', description: 'Who feels the problem most and what they expect.' },
  { id: 'feasibility', label: 'Feasibility & Build', description: 'Scope, blockers, and MVP realism for vibe coding.' },
  { id: 'pricing', label: 'Pricing & Monetisation', description: 'Revenue models, tiers, and willingness to pay.' },
  { id: 'go-to-market', label: 'Go-To-Market', description: 'Acquisition angles, messaging, and launch sequencing.' },
];

const VERDICT_META: Record<
  ValidationReport['recommendation'],
  { label: string; tone: string; badgeClass: string }
> = {
  build: {
    label: 'Go',
    tone: 'Green light – move forward with momentum.',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  revise: {
    label: 'Pivot',
    tone: 'Signal detected, but refine positioning or focus.',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  drop: {
    label: 'No-go',
    tone: 'High risk outweighs upside. Reframe before building.',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

const PILLAR_SECTION_MAP: Array<{
  pillarId: ValidationPillarId;
  pillarName: string;
  sectionKey?: ReportSectionKey;
}> = [
  { pillarId: 'problemClarity', pillarName: 'Problem Clarity', sectionKey: 'problem' },
  { pillarId: 'audienceFit', pillarName: 'Audience Fit', sectionKey: 'audience' },
  { pillarId: 'solutionStrength', pillarName: 'Solution Strength', sectionKey: 'go-to-market' },
  { pillarId: 'competition', pillarName: 'Competitive Edge', sectionKey: 'competition' },
  { pillarId: 'marketSize', pillarName: 'Market Size & Demand', sectionKey: 'market' },
  { pillarId: 'feasibility', pillarName: 'Feasibility', sectionKey: 'feasibility' },
  { pillarId: 'monetisation', pillarName: 'Monetisation', sectionKey: 'pricing' },
];

export default function IdeaDueDiligenceHub() {
  const params = useParams();
  const projectId = params.id as string;
  const { stageData, loading: stagesLoading, refetch: refetchStages } = useProjectStages(projectId);

  const ideaDetails: IdeaDetails | null = useMemo(() => {
    const ideateStage = stageData?.ideate;
    if (!ideateStage?.input) return null;
    try {
      return extractIdeaDetails(ideateStage.input);
    } catch {
      return null;
    }
  }, [stageData]);

  const [latestReport, setLatestReport] = useState<ValidationReportRow | null>(null);
  const [normalizedReport, setNormalizedReport] = useState<ValidationReport | null>(null);
  const [sectionResults, setSectionResults] = useState<Record<string, SectionResult>>({});
  const [loadingReport, setLoadingReport] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningReportId, setRunningReportId] = useState<string | null>(null);
  const [autoRunTriggered, setAutoRunTriggered] = useState(false);
  const [designPackLoading, setDesignPackLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadReportDetails = useCallback(
    async (reportId: string) => {
      try {
        const response = await fetch(`/api/validate/${reportId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load report details');
        }
        const data = await response.json();
        setNormalizedReport(data.normalizedReport ?? null);
        const rawSections =
          (data.report?.section_results as Record<string, SectionResult> | undefined) ?? {};
        setSectionResults(rawSections);
      } catch (err) {
        console.error('Failed to load report details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      }
    },
    [],
  );

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startStatusPolling = useCallback(
    (reportId: string) => {
      setRunningReportId(reportId);
      clearPolling();

      const poll = async () => {
        try {
          const res = await fetch(`/api/validate/status?id=${reportId}`, { cache: 'no-store' });
          if (!res.ok) {
            throw new Error('Failed to fetch validation status');
          }
          const data = await res.json();
          const report: ValidationReportRow | undefined = data.report;
          if (report) {
            setLatestReport(report);
            if (report.status === 'succeeded') {
              clearPolling();
              setRunningReportId(null);
              setStatusMessage(null);
              await loadReportDetails(reportId);
              setError(null);
            } else if (report.status === 'failed') {
              clearPolling();
              setRunningReportId(null);
              setStatusMessage(null);
              setError(report.error || 'Due diligence run failed. Try again.');
            } else {
              setStatusMessage(report.status === 'queued' ? 'Queued…' : 'Running due diligence…');
            }
          }
        } catch (err) {
          console.error('Status polling error:', err);
        }
      };

      poll();
      pollingRef.current = setInterval(poll, 4000);
    },
    [clearPolling, loadReportDetails],
  );

  const fetchLatestReport = useCallback(async () => {
    try {
      setLoadingReport(true);
      const res = await fetch(`/api/validate?projectId=${projectId}&latest=true`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load due diligence reports');
      }
      const data = await res.json();
      const report: ValidationReportRow | null = data.report || null;
      setLatestReport(report);

      if (!report) {
        setNormalizedReport(null);
        setSectionResults({});
        setStatusMessage(null);
        setError(null);
        return;
      }

      if (report.status === 'succeeded' && report.id) {
        setStatusMessage(null);
        setError(null);
        await loadReportDetails(report.id);
      } else if (report.status === 'running' || report.status === 'queued') {
        startStatusPolling(report.id);
        setStatusMessage(report.status === 'queued' ? 'Queued…' : 'Running due diligence…');
      } else if (report.status === 'failed') {
        setError(report.error || 'Due diligence run failed. Try again.');
      }
    } catch (err) {
      console.error('Failed to fetch latest report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch due diligence data');
    } finally {
      setLoadingReport(false);
    }
  }, [projectId, loadReportDetails, startStatusPolling]);

  useEffect(() => {
    void fetchLatestReport();
    return () => clearPolling();
  }, [fetchLatestReport, clearPolling]);

  const runDueDiligence = useCallback(
    async (auto = false) => {
      if (!ideaDetails) {
        setError('Complete the Ideate stage so we know which idea to validate.');
        return;
      }
      try {
        setStatusMessage(auto ? 'Preparing initial due diligence…' : 'Running fresh due diligence…');
        setError(null);
        setAutoRunTriggered(true);

        const response = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            idea: {
              title: ideaDetails.title,
              summary: ideaDetails.summary,
              aiReview: ideaDetails.context,
            },
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to start due diligence');
        }
        if (payload.reportId) {
          startStatusPolling(payload.reportId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start due diligence';
        setStatusMessage(null);
        setError(message);
        if (!auto) {
          toast.error(message);
        }
      }
    },
    [ideaDetails, projectId, startStatusPolling],
  );

  useEffect(() => {
    if (!loadingReport && !latestReport && ideaDetails && !autoRunTriggered) {
      void runDueDiligence(true);
    }
  }, [autoRunTriggered, ideaDetails, latestReport, loadingReport, runDueDiligence]);

  const handleGenerateDesignPack = useCallback(async () => {
    if (!projectId || !normalizedReport) {
      toast.error('Run due diligence first.');
      return;
    }
    try {
      setDesignPackLoading(true);
      const designInput = buildDesignPackInput(normalizedReport);
      const response = await fetch(`/api/projects/${projectId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'design',
          input: JSON.stringify(designInput),
          output: JSON.stringify({
            seededFromReportId: latestReport?.id,
            seededAt: new Date().toISOString(),
            source: 'validation_report',
          }),
          status: 'in_progress',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to seed design stage');
      }
      toast.success('Design stage seeded with the latest due diligence insights.');
      refetchStages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate design pack';
      toast.error(message);
    } finally {
      setDesignPackLoading(false);
    }
  }, [latestReport?.id, normalizedReport, projectId, refetchStages]);

  const verdictInfo = useMemo(() => {
    const recommendation =
      normalizedReport?.recommendation || (latestReport?.recommendation as ValidationReport['recommendation']) || 'revise';
    return VERDICT_META[recommendation];
  }, [latestReport?.recommendation, normalizedReport?.recommendation]);

  const reasons = useMemo(
    () => buildTopReasons(latestReport, normalizedReport),
    [latestReport, normalizedReport],
  );

  const risks = useMemo(
    () => buildRiskHighlights(latestReport, normalizedReport),
    [latestReport, normalizedReport],
  );

  const pillarResults = useMemo(
    () => buildPillarResults(sectionResults, normalizedReport),
    [sectionResults, normalizedReport],
  );

  const insightCards = useMemo(
    () =>
      SECTION_CARDS.map((section) => {
        const result = sectionResults[section.id];
        const href = `/project/${projectId}/validate/${section.id}`;
        return { ...section, href, result };
      }),
    [projectId, sectionResults],
  );

  const confidenceScore = normalizedReport?.overallConfidence ?? latestReport?.overall_confidence ?? null;
  const lastRunLabel = latestReport?.updated_at ? formatRelativeTime(latestReport.updated_at) : null;
  const canRun = Boolean(ideaDetails) && !runningReportId;

  return (
    <div className="space-y-8 px-2 pb-24 pt-6 sm:px-4 lg:px-6">
      <header className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-purple-50/40 to-white p-6 shadow-sm lg:p-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Stage · Idea Due Diligence</p>
        <h1 className="text-3xl font-semibold text-neutral-900">Due Diligence Hub</h1>
        <p className="mt-2 max-w-3xl text-neutral-600">
          AI runs a full diligence loop on your selected idea, generates an audit trail across seven pillars, and prepares
          a design-ready brief you can hand off downstream.
        </p>
        {ideaDetails && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Idea on file</p>
            <h2 className="text-xl font-semibold text-neutral-900">{ideaDetails.title}</h2>
            <p className="mt-2 text-sm text-neutral-600 line-clamp-3 whitespace-pre-line">{ideaDetails.summary}</p>
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">Due Diligence Verdict</CardTitle>
              <p className="text-sm text-neutral-600">Latest recommendation plus confidence score.</p>
            </div>
            <Badge className={cn('rounded-full px-4 py-1 text-sm font-semibold', verdictInfo.badgeClass)}>
              {verdictInfo.label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {statusMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}
            {!statusMessage && (
              <p className="text-sm text-neutral-700">{verdictInfo.tone}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Confidence</p>
                <span className="text-3xl font-semibold text-neutral-900">
                  {confidenceScore !== null ? `${confidenceScore}/100` : '--'}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Last run</p>
                <span className="text-lg font-semibold text-neutral-900">
                  {lastRunLabel || 'Not yet'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => runDueDiligence(false)}
                disabled={!canRun}
                className="inline-flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                {runningReportId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Run due diligence
                  </>
                )}
              </Button>
              {!ideaDetails && !stagesLoading && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Finish the Ideate stage so we know which idea to analyse.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg text-neutral-900">Next step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-neutral-700">
              Generate a Design Pack so every downstream stage inherits the validated story.
            </p>
            <Button
              onClick={handleGenerateDesignPack}
              disabled={!normalizedReport || designPackLoading}
              variant="outline"
              className="w-full items-center justify-center border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {designPackLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Design Pack
                </>
              )}
            </Button>
            <p className="text-xs text-neutral-500">
              Updates the Design stage inputs so you can keep shipping without copying data manually.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InsightListCard
          title="Top reasons to believe"
          emptyLabel="Run due diligence to see AI insights."
          items={reasons}
        />
        <InsightListCard
          title="Risk radar (highest alerts)"
          emptyLabel="Run due diligence to reveal risk spikes."
          items={risks}
        />
      </section>

      <section className="rounded-3xl border border-neutral-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Diagnostics</p>
            <h2 className="text-2xl font-semibold text-neutral-900">7 Pillar Scorecard</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Each pillar links back to the detailed drill-down sections below.
            </p>
          </div>
          {pillarResults.length > 0 && (
            <div className="text-right text-sm text-neutral-600">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Pillar count</p>
              <span className="text-2xl font-semibold text-neutral-900">{pillarResults.length}</span>
            </div>
          )}
        </div>
        <div className="mt-6">
          {pillarResults.length ? (
            <>
              <PillarGrid pillars={pillarResults} busy={Boolean(runningReportId)} />
              <div className="mt-6">
                <AIFocusSummary pillars={pillarResults} />
              </div>
            </>
          ) : (
            <Card className="border border-dashed border-neutral-200 bg-white p-6 text-center text-neutral-500">
              No pillar analysis yet. Run due diligence to unlock the scorecard.
            </Card>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Design-ready Product Overview</p>
            <h2 className="text-2xl font-semibold text-neutral-900">Blueprint snapshot</h2>
            <p className="text-sm text-neutral-600">
              Personas, differentiators, and feature map pulled directly from the diligence run.
            </p>
          </div>
        </div>
        {normalizedReport ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="border-neutral-100 bg-neutral-50/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-800">Personas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-neutral-700">
                {renderPersonas(normalizedReport.personas)}
              </CardContent>
            </Card>
            <Card className="border-neutral-100 bg-neutral-50/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-800">Feature map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-700">
                {renderFeatureMap(normalizedReport.featureMap)}
              </CardContent>
            </Card>
            <Card className="border-neutral-100 bg-neutral-50/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-800">Positioning & monetisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                {normalizedReport.ideaEnhancement ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Why it wins</p>
                      <p>{normalizedReport.ideaEnhancement.whyItWins}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Unique angle</p>
                      <p>{normalizedReport.ideaEnhancement.uniqueAngle}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Pricing</p>
                      <p>{normalizedReport.ideaEnhancement.pricingStrategy}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500">Run due diligence to populate positioning insights.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-center text-neutral-500">
            Run due diligence to generate the blueprint summary.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Drill-down</p>
          <h2 className="text-2xl font-semibold text-neutral-900">Section deep dives</h2>
          <p className="text-sm text-neutral-600">
            Each card opens the legacy validation sections so you can regenerate or explore more detail.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insightCards.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card className="h-full border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-purple-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{section.label}</p>
                    <p className="text-xs text-neutral-500">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-purple-600">
                    <span>Open</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                {section.result ? (
                  <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-700">
                    <p className="font-semibold text-neutral-900">{Math.round(section.result.score)}/100</p>
                    <p className="text-xs text-neutral-500">
                      Updated {section.result.updated_at ? formatRelativeTime(section.result.updated_at) : 'recently'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-neutral-200 p-3 text-sm text-neutral-500">
                    Run this section to unlock a summary.
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs < 0) return 'Just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function buildTopReasons(
  rawReport: ValidationReportRow | null,
  normalizedReport: ValidationReport | null,
) {
  const rationales =
    (rawReport?.rationales as Record<string, string> | undefined) || normalizedReport?.rationales || {};
  const scores =
    (rawReport?.scores as Record<string, number> | undefined) || normalizedReport?.scores || {};

  return Object.entries(rationales)
    .map(([key, value]) => ({
      key,
      value,
      score: scores[key] ?? 0,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((entry) => ({
      title: rationaleLabel(entry.key),
      description: entry.value,
    }));
}

function rationaleLabel(key: string) {
  switch (key) {
    case 'marketDemand':
      return 'Market demand';
    case 'audienceFit':
      return 'Audience fit';
    case 'competition':
      return 'Competitive angle';
    case 'feasibility':
      return 'Feasibility';
    case 'pricingPotential':
      return 'Pricing power';
    default:
      return key;
  }
}

function buildRiskHighlights(
  rawReport: ValidationReportRow | null,
  normalizedReport: ValidationReport | null,
) {
  const riskRadar =
    (rawReport?.risk_radar as RiskRadar | undefined) || normalizedReport?.riskRadar || null;

  if (!riskRadar) {
    return [];
  }

  const entries = [
    { key: 'market', label: 'Market shifts', value: riskRadar.market },
    { key: 'competition', label: 'Competition', value: riskRadar.competition },
    { key: 'technical', label: 'Technical delivery', value: riskRadar.technical },
    { key: 'monetisation', label: 'Monetisation', value: riskRadar.monetisation },
    { key: 'goToMarket', label: 'Go-to-market', value: riskRadar.goToMarket },
  ]
    .filter((entry) => typeof entry.value === 'number')
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 3);

  return entries.map((entry, idx) => ({
    title: entry.label,
    description: riskRadar.commentary?.[idx] || 'Investigate mitigation steps in the drill-down.',
  }));
}

function buildPillarResults(
  sections: Record<string, SectionResult>,
  normalizedReport: ValidationReport | null,
): ValidationPillarResult[] {
  return PILLAR_SECTION_MAP.map((definition) => {
    const section = definition.sectionKey ? sections[definition.sectionKey] : undefined;
    const baseScore = section?.score ?? normalizedReport?.overallConfidence ?? 0;
    const score = clampToTen(baseScore);
    const fallback = createPillarFallback(definition.pillarId, normalizedReport);

    return {
      pillarId: definition.pillarId,
      pillarName: definition.pillarName,
      score,
      analysis: section?.summary || fallback.analysis,
      strength: section?.insightBreakdown?.meaning || section?.actions?.[0] || fallback.strength,
      weakness: section?.insightBreakdown?.impact || section?.actions?.[1] || fallback.weakness,
      improvementSuggestion: section?.actions?.[0] || fallback.improve,
    };
  });
}

function clampToTen(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value / 10)));
}

function createPillarFallback(pillarId: ValidationPillarId, report: ValidationReport | null) {
  const defaultCopy = {
    analysis: 'Run due diligence to unlock this pillar.',
    strength: 'Not enough signals yet.',
    weakness: 'Awaiting AI insight.',
    improve: 'Open the drill-down section for tailored guidance.',
  };

  if (!report) {
    return defaultCopy;
  }

  switch (pillarId) {
    case 'audienceFit':
      return {
        analysis:
          report.personas?.[0]?.description || defaultCopy.analysis,
        strength:
          report.personas?.[0]?.needs?.[0] || defaultCopy.strength,
        weakness:
          report.personas?.[0]?.painPoints?.[0] || defaultCopy.weakness,
        improve: 'Use the Audience drill-down to validate the core persona pains.',
      };
    case 'problemClarity':
      return {
        analysis: report.ideaSummary || defaultCopy.analysis,
        strength: report.ideaEnhancement?.strongerPositioning || defaultCopy.strength,
        weakness: report.ideaEnhancement?.betterTargetAudiences?.[0] || defaultCopy.weakness,
        improve: 'Clarify the exact users and moments when the problem peaks.',
      };
    case 'solutionStrength':
      return {
        analysis: report.ideaEnhancement?.uniqueAngle || defaultCopy.analysis,
        strength: report.ideaEnhancement?.differentiators?.[0] || defaultCopy.strength,
        weakness: report.ideaEnhancement?.featureAdditions?.[0] || defaultCopy.weakness,
        improve: 'Translate differentiators into end-to-end journeys inside Go-To-Market.',
      };
    case 'competition':
      return {
        analysis: report.ideaEnhancement?.strongerPositioning || defaultCopy.analysis,
        strength: report.ideaEnhancement?.differentiators?.slice(0, 1).join(', ') || defaultCopy.strength,
        weakness: report.ideaEnhancement?.differentiators?.slice(1, 2).join(', ') || defaultCopy.weakness,
        improve: 'Use the Competition drill-down to benchmark pricing and gaps.',
      };
    case 'marketSize':
      return {
        analysis: report.ideaSummary || defaultCopy.analysis,
        strength: report.opportunityScore?.rationale || defaultCopy.strength,
        weakness: 'Validate TAM/SAM with numbers in the Market section.',
        improve: 'Quantify demand signals to sharpen growth projections.',
      };
    case 'feasibility':
      return {
        analysis:
          report.featureMap?.must?.slice(0, 2).join(', ') ||
          report.ideaEnhancement?.featureAdditions?.slice(0, 2).join(', ') ||
          defaultCopy.analysis,
        strength: report.ideaEnhancement?.whyItWins || defaultCopy.strength,
        weakness: 'Call out automation plan, technical dependencies, and blockers.',
        improve: 'Use Feasibility drill-down to scope the vibe coding path.',
      };
    case 'monetisation':
      return {
        analysis: report.ideaEnhancement?.pricingStrategy || defaultCopy.analysis,
        strength: report.ideaEnhancement?.featureAdditions?.[0] || defaultCopy.strength,
        weakness: 'Clarify primary monetisation path.',
        improve: 'Explore the Pricing drill-down for model + tier suggestions.',
      };
    default:
      return defaultCopy;
  }
}

function renderPersonas(personas?: Persona[] | null) {
  if (!personas?.length) {
    return <p className="text-neutral-500">Run due diligence to generate personas.</p>;
  }
  return personas.slice(0, 3).map((persona) => (
    <div key={persona.name} className="rounded-xl bg-white/90 p-3 shadow-sm">
      <p className="text-sm font-semibold text-neutral-900">{persona.name}</p>
      <p className="text-xs text-neutral-500">{persona.role}</p>
      <p className="mt-1 text-sm text-neutral-700">{persona.description}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">Needs</p>
      <p className="text-sm text-neutral-700">
        {(persona.needs && persona.needs.length
          ? persona.needs.slice(0, 2)
          : ['Add explicit persona needs']).join(', ')}
      </p>
    </div>
  ));
}

function renderFeatureMap(featureMap?: FeatureMap | null) {
  if (!featureMap) {
    return <p className="text-neutral-500">Feature map will appear after due diligence runs.</p>;
  }

  return (
    <>
      <FeatureList label="Must have" items={featureMap.must} tone="text-emerald-700" />
      <FeatureList label="Should have" items={featureMap.should} tone="text-amber-700" />
      <FeatureList label="Could have" items={featureMap.could} tone="text-neutral-700" />
    </>
  );
}

function FeatureList({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={cn('text-xs uppercase tracking-wide', tone)}>{label}</p>
      <ul className="mt-1 list-disc pl-4 text-sm text-neutral-700">
        {items.slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function buildDesignPackInput(report: ValidationReport) {
  const productType = [
    `Positioning: ${report.ideaEnhancement?.strongerPositioning || report.ideaEnhancement?.uniqueAngle || 'Clarify differentiators.'}`,
    `Why it wins: ${report.ideaEnhancement?.whyItWins || 'Spell out the magic moment.'}`,
  ].join('\n\n');

  const keyFeatures = (() => {
    if (!report.featureMap) return 'Define MVP feature list.';
    const lines: string[] = [];
    if (report.featureMap.must?.length) {
      lines.push('Must haves:\n- ' + report.featureMap.must.join('\n- '));
    }
    if (report.featureMap.should?.length) {
      lines.push('\nShould haves:\n- ' + report.featureMap.should.join('\n- '));
    }
    return lines.join('\n').trim();
  })();

  const userPersonas = report.personas
    ?.slice(0, 3)
    .map(
      (persona) =>
        `${persona.name} (${persona.role})\nNeeds: ${persona.needs.slice(0, 3).join(', ')}\nPains: ${persona.pains?.slice(0, 2).join(', ')}`,
    )
    .join('\n\n') || 'Describe the target personas and their needs.';

  const designStyle = report.ideaEnhancement?.uniqueAngle
    ? `Unique angle: ${report.ideaEnhancement.uniqueAngle}\nDifferentiators: ${report.ideaEnhancement.differentiators?.join(', ') || 'Call out signature UX moments.'}`
    : 'Document the tone, brand hooks, and signature UI patterns.';

  return {
    productType,
    keyFeatures,
    userPersonas,
    designStyle,
    seededFrom: 'validation-report',
    reportId: report.id,
  };
}

function InsightListCard({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-700">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
