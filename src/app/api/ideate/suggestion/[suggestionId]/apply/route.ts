import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { loadLatestRun, loadRunById, mapRunRow } from "@/server/ideate/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ suggestionId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { suggestionId } = await params;
  if (!suggestionId) {
    return NextResponse.json({ error: "suggestionId is required" }, { status: 400 });
  }

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

  const updatedSuggestions = run.suggestions.map((suggestion) =>
    suggestion.id === suggestionId
      ? { ...suggestion, applied: true }
      : suggestion,
  );

  const quickTakes = run.quickTakes.map((item, index) => ({
    ...item,
    delta: index === 0 ? "+0.1" : item.delta,
  }));

  const supabase = getSupabaseServer();
  const { data: updatedRun } = await supabase
    .from("ideate_runs")
    .update({
      suggestions: updatedSuggestions,
      quick_takes: quickTakes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", run.id)
    .eq("user_id", userId)
    .select("*, pillars:ideate_pillar_snapshots(*)")
    .maybeSingle();

  return NextResponse.json({ run: updatedRun ? mapRunRow(updatedRun) : run });
}
