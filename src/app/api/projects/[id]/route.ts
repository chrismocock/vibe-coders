import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("projects")
      .select("id,title,description,progress,logo_url")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: data }, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { progress, title, description, logo_url } = body ?? {};

    const update: Record<string, any> = {};

    if (progress !== undefined) {
      const parsed = Number(progress);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        return NextResponse.json({ error: "progress must be 0-100" }, { status: 400 });
      }
      update.progress = parsed;
    }

    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) {
        return NextResponse.json({ error: "title must be non-empty" }, { status: 400 });
      }
      if (t.length > 200) {
        return NextResponse.json({ error: "title too long (max 200 chars)" }, { status: 400 });
      }
      update.title = t;
    }

    if (description !== undefined) {
      const d = String(description).trim();
      update.description = d;
    }

    if (logo_url !== undefined) {
      update.logo_url = logo_url ? String(logo_url).trim() : null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("projects")
      .update(update)
      .eq("id", params.id)
      .eq("user_id", userId)
      .select("id,title,description,progress,logo_url")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseServer();

    // Delete related project_stages first
    const { error: stagesError } = await supabase
      .from("project_stages")
      .delete()
      .eq("project_id", params.id)
      .eq("user_id", userId);

    if (stagesError) {
      console.error("Supabase stage delete error:", stagesError);
      return NextResponse.json({ error: stagesError.message }, { status: 500 });
    }

    const { error: projectError } = await supabase
      .from("projects")
      .delete()
      .eq("id", params.id)
      .eq("user_id", userId);

    if (projectError) {
      console.error("Supabase project delete error:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


