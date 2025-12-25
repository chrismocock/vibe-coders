import { IDEATE_PILLARS } from "@/lib/ideate/pillars";
import type {
  Experiment,
  IdeateRun,
  PillarSnapshot,
  QuickTake,
  Suggestion,
} from "@/lib/ideate/types";
import { getSupabaseServer } from "@/lib/supabaseServer";

const fallbackQuickTakes: QuickTake[] = [
  { label: "Overall", value: "7.6 / 10", delta: "+0.8" },
  { label: "Confidence", value: "Moderate", delta: "↑" },
  { label: "Theme", value: "Guided onboarding" },
  { label: "Effort", value: "2 sprints" },
];

const fallbackSuggestions: Suggestion[] = [
  {
    id: "s1",
    pillarId: "audienceFit",
    title: "Guided aha moments",
    description:
      "Lead with admin outcomes and a guided flow that makes automation value obvious in the first session.",
    impact: "High",
    effort: "Medium",
    applied: false,
  },
  {
    id: "s2",
    pillarId: "competition",
    title: "Automation gallery CTA",
    description: "Expose three automation wins in the first session to make differentiation obvious.",
    impact: "Medium",
    effort: "Low",
    applied: false,
  },
  {
    id: "s3",
    pillarId: "feasibility",
    title: "Analytics guardrails",
    description: "Ship a minimal instrumentation checklist to keep experiments trustworthy.",
    impact: "Medium",
    effort: "Low",
    applied: true,
  },
];

const fallbackExperiments: Experiment[] = [
  {
    id: "exp-1",
    name: "Template-led onboarding",
    goal: "Lift admin activation to 42%",
    owner: "Nina",
    startDate: "Jun 3",
    status: "draft",
  },
  {
    id: "exp-2",
    name: "Automation gallery spotlight",
    goal: "Increase aha rate by 10%",
    owner: "Kai",
    startDate: "Jun 4",
    status: "validating",
  },
];

function fallbackPillars(): PillarSnapshot[] {
  return IDEATE_PILLARS.map((pillar, index) => ({
    id: `${pillar.id}-${index}`,
    pillarId: pillar.id,
    name: pillar.label,
    score: 7 + index * 0.2,
    delta: index % 2 === 0 ? 0.6 : -0.3,
    summary:
      index === 0
        ? "Messaging now leads with admin value; still weak for enterprise security needs."
        : "Differentiation and feasibility are improving with clearer guidance and analytics support.",
    opportunities: [
      "Showcase admin-only workflows in hero and onboarding.",
      "Add a security highlights micro-page in the flow.",
    ],
    risks: ["Enterprise blockers could slow adoption without SOC2 messaging."],
  }));
}

export function buildFallbackRun(projectId: string, userId: string): IdeateRun {
  return {
    id: `draft-${Date.now()}`,
    projectId,
    userId,
    headline: "Boost conversion on the self-serve onboarding funnel",
    narrative:
      "Increase activation for workspace admins by clarifying value, reducing friction, and creating a more compelling first project path.",
    lastRunAt: new Date().toISOString(),
    quickTakes: fallbackQuickTakes,
    risks: [
      "Messaging changes could depress signups if not tested with multiple segments.",
      "Requires coordination with analytics to measure activation correctly.",
    ],
    opportunities: [
      "Segmented onboarding paths for admins vs members unlock faster aha moments.",
      "Small nudges in the first 3 minutes drive outsized conversion lifts.",
    ],
    pillars: fallbackPillars(),
    suggestions: fallbackSuggestions,
    experiments: fallbackExperiments,
  };
}

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizePillar(raw: any): PillarSnapshot {
  return {
    id: raw.id,
    pillarId: raw.pillar_id ?? raw.pillarId ?? raw.id,
    name: raw.name ?? raw.label ?? "Pillar",
    score: typeof raw.score === "number" ? raw.score : Number(raw.score ?? 0),
    delta:
      typeof raw.delta === "number"
        ? raw.delta
        : raw.delta !== undefined
          ? Number(raw.delta)
          : undefined,
    summary: raw.summary ?? "",
    opportunities: normalizeArray<string>(raw.opportunities, []),
    risks: normalizeArray<string>(raw.risks, []),
  };
}

export function mapRunRow(row: any): IdeateRun {
  const pillarsSource = (row.pillars || row.ideate_pillar_snapshots || []) as any[];
  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    userId: row.user_id ?? row.userId,
    headline: row.headline ?? "",
    narrative: row.narrative ?? "",
    lastRunAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    quickTakes: normalizeArray<QuickTake>(row.quick_takes, []),
    risks: normalizeArray<string>(row.risks, []),
    opportunities: normalizeArray<string>(row.opportunities, []),
    pillars: pillarsSource.map(normalizePillar),
    suggestions: normalizeArray<Suggestion>(row.suggestions, []),
    experiments: normalizeArray<Experiment>(row.experiments, []),
  };
}

export async function loadRunById(
  runId: string,
  userId: string,
): Promise<IdeateRun | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ideate_runs")
    .select("*, pillars:ideate_pillar_snapshots(*)")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load ideate run by id", error);
    return null;
  }

  return data ? mapRunRow(data) : null;
}

export async function loadLatestRun(
  projectId: string,
  userId: string,
): Promise<IdeateRun | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ideate_runs")
    .select("*, pillars:ideate_pillar_snapshots(*)")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load latest ideate run", error);
    return null;
  }

  return data ? mapRunRow(data) : null;
}

export async function insertIdeateRun(
  payload: Partial<IdeateRun> & { projectId: string; userId: string },
): Promise<IdeateRun> {
  const supabase = getSupabaseServer();
  const fallback = buildFallbackRun(payload.projectId, payload.userId);

  const quickTakes = payload.quickTakes ?? fallback.quickTakes;
  const risks = payload.risks ?? fallback.risks;
  const opportunities = payload.opportunities ?? fallback.opportunities;
  const suggestions = payload.suggestions ?? fallback.suggestions;
  const experiments = payload.experiments ?? fallback.experiments;
  const pillars = payload.pillars?.length ? payload.pillars : fallback.pillars;

  const { data: runRow, error } = await supabase
    .from("ideate_runs")
    .insert({
      project_id: payload.projectId,
      user_id: payload.userId,
      headline: payload.headline ?? fallback.headline,
      narrative: payload.narrative ?? fallback.narrative,
      quick_takes: quickTakes,
      risks,
      opportunities,
      suggestions,
      experiments,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !runRow) {
    throw new Error(error?.message || "Unable to create ideate run");
  }

  if (pillars.length) {
    const { error: pillarError } = await supabase.from("ideate_pillar_snapshots").insert(
      pillars.map((pillar) => ({
        run_id: runRow.id,
        pillar_id: pillar.pillarId ?? pillar.id,
        name: pillar.name,
        score: pillar.score,
        delta: pillar.delta,
        summary: pillar.summary,
        opportunities: pillar.opportunities,
        risks: pillar.risks,
      })),
    );

    if (pillarError) {
      console.error("Failed to insert pillar snapshots", pillarError);
    }
  }

  const { data: withPillars } = await supabase
    .from("ideate_runs")
    .select("*, pillars:ideate_pillar_snapshots(*)")
    .eq("id", runRow.id)
    .maybeSingle();

  return mapRunRow(withPillars ?? runRow);
}
