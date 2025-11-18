import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: Request
) {
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
      .from("design_blueprints")
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
      productBlueprint,
      userPersonas,
      userJourney,
      informationArchitecture,
      wireframes,
      brandIdentity,
      mvpDefinition,
      designSummary,
      renderedMarkdown,
      sectionCompletion,
      lastAiRun,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Check if blueprint exists
    const { data: existing } = await supabase
      .from("design_blueprints")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const blueprintData: any = {
      project_id: projectId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (productBlueprint !== undefined) blueprintData.product_blueprint = productBlueprint;
    if (userPersonas !== undefined) blueprintData.user_personas = userPersonas;
    if (userJourney !== undefined) blueprintData.user_journey = userJourney;
    if (informationArchitecture !== undefined) blueprintData.information_architecture = informationArchitecture;
    if (wireframes !== undefined) blueprintData.wireframes = wireframes;
    if (brandIdentity !== undefined) blueprintData.brand_identity = brandIdentity;
    if (mvpDefinition !== undefined) blueprintData.mvp_definition = mvpDefinition;
    if (designSummary !== undefined) blueprintData.design_summary = designSummary;
    if (renderedMarkdown !== undefined) blueprintData.rendered_markdown = renderedMarkdown;
    if (sectionCompletion !== undefined) blueprintData.section_completion = sectionCompletion;
    if (lastAiRun !== undefined) blueprintData.last_ai_run = lastAiRun;

    let result;
    if (existing) {
      // Update existing blueprint
      const { data, error } = await supabase
        .from("design_blueprints")
        .update(blueprintData)
        .eq("id", existing.id)
        .select("*")
        .single();

      result = { data, error };
    } else {
      // Create new blueprint
      blueprintData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("design_blueprints")
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

