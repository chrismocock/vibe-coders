import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

async function verifyProjectAccess(projectId: string, userId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Project access error:", error);
    if (error.code === "PGRST116") {
      return { ok: false as const, status: 404, message: "Project not found" };
    }
    return { ok: false as const, status: 500, message: error.message };
  }

  if (!data) {
    return { ok: false as const, status: 404, message: "Project not found" };
  }

  return { ok: true as const, supabase };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const access = await verifyProjectAccess(id, userId);
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }
    const supabase = access.supabase!;

    const { data, error } = await supabase
      .from("idea_improvements")
      .select("id,pillar_improved,before_text,after_text,score_delta,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ideate improvements fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ improvements: data ?? [] });
  } catch (err) {
    console.error("Ideate improvements API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { improvementId, purgeAll } = body ?? {};

    if (!purgeAll && !improvementId) {
      return NextResponse.json(
        { error: "Provide improvementId or set purgeAll to true" },
        { status: 400 },
      );
    }

    const { id } = await params;
    const access = await verifyProjectAccess(id, userId);
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }
    const supabase = access.supabase!;

    if (purgeAll) {
      const { error } = await supabase
        .from("idea_improvements")
        .delete()
        .eq("project_id", id);

      if (error) {
        console.error("Purge improvements error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, purged: true });
    }

    const { error } = await supabase
      .from("idea_improvements")
      .delete()
      .eq("project_id", id)
      .eq("id", improvementId);

    if (error) {
      console.error("Delete improvement error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, purged: false });
  } catch (err) {
    console.error("Ideate improvements delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
