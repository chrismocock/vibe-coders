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

  if (!projectId && !runId) {
    return NextResponse.json({ error: "projectId or runId is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const run = runId
    ? await loadRunById(runId, userId)
    : projectId
      ? await loadLatestRun(projectId, userId)
      : null;

  if (!run) {
    return NextResponse.json({ error: "Ideate run not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId ?? run.projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const validateInput = {
    selectedIdea: run.headline,
    context: run.narrative,
    quickTakes: run.quickTakes,
    pillars: run.pillars,
    risks: run.risks,
    opportunities: run.opportunities,
  };

  const { data: existingStage } = await supabase
    .from("project_stages")
    .select("id")
    .eq("project_id", projectId ?? run.projectId)
    .eq("stage", "validate")
    .eq("user_id", userId)
    .maybeSingle();

  let stageResult;
  if (existingStage) {
    stageResult = await supabase
      .from("project_stages")
      .update({
        input: validateInput,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingStage.id)
      .select("*")
      .maybeSingle();
  } else {
    stageResult = await supabase
      .from("project_stages")
      .insert({
        project_id: projectId ?? run.projectId,
        user_id: userId,
        stage: "validate",
        input: validateInput,
        status: "in_progress",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();
  }

  if (stageResult.error) {
    console.error("Failed to import ideate run into validate stage", stageResult.error);
    return NextResponse.json({ error: "Failed to import ideate run" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    stage: stageResult.data,
  });
}
