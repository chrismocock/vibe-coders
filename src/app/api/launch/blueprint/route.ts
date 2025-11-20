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
      .from("launch_blueprints")
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
      launchPathChoice,
      strategyPlan,
      messagingFramework,
      landingOnboarding,
      earlyAdopters,
      marketingAssets,
      trackingMetrics,
      launchPack,
      sectionCompletion,
      buildPathSnapshot,
      lastAiRun,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Check if blueprint exists
    const { data: existing } = await supabase
      .from("launch_blueprints")
      .select("id, build_path_snapshot")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    // If creating new blueprint and build_path_snapshot not provided, fetch from build_blueprints
    let snapshotToUse = buildPathSnapshot;
    if (!existing && !snapshotToUse) {
      const { data: buildBlueprint } = await supabase
        .from("build_blueprints")
        .select("build_path")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();
      
      if (buildBlueprint?.build_path) {
        snapshotToUse = buildBlueprint.build_path;
      }
    } else if (existing?.build_path_snapshot) {
      // Always use existing snapshot if available (don't overwrite)
      snapshotToUse = existing.build_path_snapshot;
    }

    const blueprintData: any = {
      project_id: projectId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (launchPathChoice !== undefined) blueprintData.launch_path_choice = launchPathChoice;
    if (strategyPlan !== undefined) blueprintData.strategy_plan = strategyPlan;
    if (messagingFramework !== undefined) blueprintData.messaging_framework = messagingFramework;
    if (landingOnboarding !== undefined) blueprintData.landing_onboarding = landingOnboarding;
    if (earlyAdopters !== undefined) blueprintData.early_adopters = earlyAdopters;
    if (marketingAssets !== undefined) blueprintData.marketing_assets = marketingAssets;
    if (trackingMetrics !== undefined) blueprintData.tracking_metrics = trackingMetrics;
    if (launchPack !== undefined) blueprintData.launch_pack = launchPack;
    if (sectionCompletion !== undefined) blueprintData.section_completion = sectionCompletion;
    if (snapshotToUse !== undefined) blueprintData.build_path_snapshot = snapshotToUse;
    if (lastAiRun !== undefined) blueprintData.last_ai_run = lastAiRun;

    let result;
    if (existing) {
      // Update existing blueprint
      const { data, error } = await supabase
        .from("launch_blueprints")
        .update(blueprintData)
        .eq("id", existing.id)
        .select("*")
        .single();

      result = { data, error };
    } else {
      // Create new blueprint
      blueprintData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("launch_blueprints")
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

