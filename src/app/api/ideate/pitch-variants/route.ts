import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { loadLatestRun, loadRunById } from "@/server/ideate/store";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const projectId: string | undefined = body.projectId;
  const runId: string | undefined = body.runId;
  const preferredHeadline: string | undefined = body.headline;

  if (!projectId && !runId) {
    return NextResponse.json({ error: "projectId or runId is required" }, { status: 400 });
  }

  const run = runId
    ? await loadRunById(runId, userId)
    : projectId
      ? await loadLatestRun(projectId, userId)
      : null;

  if (!run) {
    return NextResponse.json({ error: "Ideate run not found" }, { status: 404 });
  }

  const baseHeadline = preferredHeadline?.trim() || run.headline;
  const variants = [
    {
      id: `${run.id}-pitch-1`,
      headline: baseHeadline,
      summary: run.narrative,
    },
    {
      id: `${run.id}-pitch-2`,
      headline: `${baseHeadline} • fast lane`,
      summary: `${run.narrative} Focus on the first five minutes to capture activation.`,
    },
    {
      id: `${run.id}-pitch-3`,
      headline: `${baseHeadline} • enterprise ready`,
      summary: `${run.narrative} Highlight security and governance to unlock enterprise teams.`,
    },
  ];

  const quickTakes = run.quickTakes.map((item, index) => ({
    ...item,
    value: index === 0 ? "7.8 / 10" : item.value,
    delta: index === 0 ? "+0.2" : item.delta,
  }));

  const supabase = getSupabaseServer();
  await supabase
    .from("ideate_runs")
    .update({
      headline: baseHeadline,
      quick_takes: quickTakes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", run.id)
    .eq("user_id", userId);

  return NextResponse.json({ variants, quickTakes });
}
