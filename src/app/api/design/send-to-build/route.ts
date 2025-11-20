import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Get design blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from("design_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json(
        { error: "Design blueprint not found" },
        { status: 404 }
      );
    }

    // Extract data for Build stage
    const productBlueprint = blueprint.product_blueprint || {};
    const informationArchitecture = blueprint.information_architecture || {};
    const mvpDefinition = blueprint.mvp_definition || {};

    // Build tech stack recommendation from Product Blueprint + IA
    let techStack = "";
    if (productBlueprint.techStack) {
      techStack = productBlueprint.techStack;
    } else if (informationArchitecture.techRecommendations) {
      techStack = informationArchitecture.techRecommendations;
    } else {
      techStack = "Based on your design blueprint, we recommend a modern web stack. Please review and customize.";
    }

    // Build requirements from Product Blueprint + IA
    let requirements = "";
    if (productBlueprint.featureList) {
      requirements = `Features:\n${typeof productBlueprint.featureList === "string" ? productBlueprint.featureList : JSON.stringify(productBlueprint.featureList, null, 2)}\n\n`;
    }
    if (informationArchitecture.siteMap) {
      requirements += `Information Architecture:\n${typeof informationArchitecture.siteMap === "string" ? informationArchitecture.siteMap : JSON.stringify(informationArchitecture.siteMap, null, 2)}`;
    }

    // Build input data for Build stage
    const buildInput: any = {
      techStack: techStack || "AI will recommend the best tech stack for your project based on your product type, team size, budget, and timeline...",
      requirements: requirements || "AI will outline technical requirements, architecture, and key integrations...",
    };

    // Check if Build stage exists
    const { data: existingBuild } = await supabase
      .from("project_stages")
      .select("id")
      .eq("project_id", projectId)
      .eq("stage", "build")
      .eq("user_id", userId)
      .single();

    if (existingBuild) {
      // Update existing Build stage
      const { error: updateError } = await supabase
        .from("project_stages")
        .update({
          input: JSON.stringify(buildInput),
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBuild.id);

      if (updateError) {
        console.error("Failed to update Build stage:", updateError);
        return NextResponse.json({ error: "Failed to update Build stage" }, { status: 500 });
      }
    } else {
      // Create new Build stage
      const { error: insertError } = await supabase
        .from("project_stages")
        .insert({
          project_id: projectId,
          user_id: userId,
          stage: "build",
          input: JSON.stringify(buildInput),
          status: "in_progress",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Failed to create Build stage:", insertError);
        return NextResponse.json({ error: "Failed to create Build stage" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Design data sent to Build stage",
      buildInput,
    });
  } catch (error) {
    console.error("Send to build error:", error);
    return NextResponse.json(
      { error: "Failed to send design data to Build stage" },
      { status: 500 }
    );
  }
}

