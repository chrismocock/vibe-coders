import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("build_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json({ blueprint: null });
      }
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blueprint: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      projectId,
      buildPath,
      mvpScope,
      featureSpecs,
      dataModel,
      screensComponents,
      integrations,
      developerPack,
      sectionCompletion,
      lastAiRun,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Check if blueprint exists
    const { data: existing } = await supabase
      .from("build_blueprints")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const blueprintData: any = {
      project_id: projectId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (buildPath !== undefined) blueprintData.build_path = buildPath;
    if (mvpScope !== undefined) blueprintData.mvp_scope = mvpScope;
    if (featureSpecs !== undefined) blueprintData.feature_specs = featureSpecs;
    if (dataModel !== undefined) blueprintData.data_model = dataModel;
    if (screensComponents !== undefined) blueprintData.screens_components = screensComponents;
    if (integrations !== undefined) blueprintData.integrations = integrations;
    if (developerPack !== undefined) blueprintData.developer_pack = developerPack;
    if (sectionCompletion !== undefined) blueprintData.section_completion = sectionCompletion;
    if (lastAiRun !== undefined) blueprintData.last_ai_run = lastAiRun;

    let result;
    if (existing) {
      // Update existing blueprint
      const { data, error } = await supabase
        .from("build_blueprints")
        .update(blueprintData)
        .eq("id", existing.id)
        .select("*")
        .single();

      result = { data, error };
    } else {
      // Create new blueprint
      blueprintData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("build_blueprints")
        .insert(blueprintData)
        .select("*")
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error("Supabase error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ blueprint: result.data }, { status: existing ? 200 : 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

