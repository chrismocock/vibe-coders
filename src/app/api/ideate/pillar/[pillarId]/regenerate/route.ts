import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildFallbackRun, loadLatestRun, loadRunById, mapRunRow } from "@/server/ideate/store";
import type { PillarSnapshot } from "@/lib/ideate/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pillarId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pillarId } = await params;
  if (!pillarId) return NextResponse.json({ error: "pillarId is required" }, { status: 400 });

  const body = await request.json();
  const projectId: string | undefined = body.projectId;
  const runId: string | undefined = body.runId;

  const run = runId
    ? await loadRunById(runId, userId)
    : projectId
      ? await loadLatestRun(projectId, userId)
      : null;

  if (!run) {
    return NextResponse.json({ error: "Ideate run not found" }, { status: 404 });
  }

  const currentPillar = run.pillars.find(
    (pillar) => pillar.pillarId === pillarId || pillar.id === pillarId,
  );

  const refreshed: PillarSnapshot = currentPillar
    ? {
        ...currentPillar,
        score: Math.min(10, Math.round((currentPillar.score + 0.3) * 10) / 10),
        delta: (currentPillar.delta ?? 0) + 0.3,
        summary: `${currentPillar.summary} Updated with new signals.`,
        opportunities: [
          ...currentPillar.opportunities,
          "Add a lightweight experiment to validate the shift.",
        ].slice(0, 3),
        risks: [
          ...currentPillar.risks,
          "Watch for instrumentation gaps while iterating quickly.",
        ].slice(0, 3),
      }
    : {
        ...buildFallbackRun(run.projectId, run.userId).pillars[0],
        id: pillarId,
        pillarId,
      };

  const supabase = getSupabaseServer();
  const { data: existing } = await supabase
    .from("ideate_pillar_snapshots")
    .select("*")
    .eq("run_id", run.id)
    .eq("pillar_id", pillarId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("ideate_pillar_snapshots")
      .update({
        score: refreshed.score,
        delta: refreshed.delta,
        summary: refreshed.summary,
        opportunities: refreshed.opportunities,
        risks: refreshed.risks,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("ideate_pillar_snapshots").insert({
      run_id: run.id,
      pillar_id: pillarId,
      name: refreshed.name,
      score: refreshed.score,
      delta: refreshed.delta,
      summary: refreshed.summary,
      opportunities: refreshed.opportunities,
      risks: refreshed.risks,
    });
  }

  const { data: runRow } = await supabase
    .from("ideate_runs")
    .select("*, pillars:ideate_pillar_snapshots(*)")
    .eq("id", run.id)
    .maybeSingle();

  return NextResponse.json({
    pillar: refreshed,
    run: runRow ? mapRunRow(runRow) : run,
  });
}
