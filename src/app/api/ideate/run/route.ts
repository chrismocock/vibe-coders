import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { IdeateRun } from "@/lib/ideate/types";
import { buildFallbackRun, insertIdeateRun, loadLatestRun } from "@/server/ideate/store";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const run = await loadLatestRun(projectId, userId);

  if (!run) {
    return NextResponse.json({ error: "No ideate runs found" }, { status: 404 });
  }

  return NextResponse.json({ run });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as Partial<IdeateRun> & { projectId?: string };
    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", body.projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const payload: Partial<IdeateRun> & { projectId: string; userId: string } = {
      ...buildFallbackRun(body.projectId, userId),
      ...body,
      projectId: body.projectId,
      userId,
    };

    const run = await insertIdeateRun(payload);

    return NextResponse.json({ run });
  } catch (error) {
    console.error("Failed to save ideate run", error);
    return NextResponse.json({ error: "Failed to save ideate run" }, { status: 500 });
  }
}
