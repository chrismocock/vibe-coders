import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, format = "markdown" } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: blueprint, error } = await supabase
      .from("design_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !blueprint) {
      return NextResponse.json(
        { error: "Design blueprint not found" },
        { status: 404 }
      );
    }

    // Generate markdown export
    let markdown = `# Design Blueprint\n\n`;
    markdown += `Generated: ${new Date(blueprint.updated_at || blueprint.created_at).toLocaleDateString()}\n\n`;

    if (blueprint.product_blueprint) {
      markdown += `## Product Blueprint\n\n`;
      if (typeof blueprint.product_blueprint === "object") {
        markdown += JSON.stringify(blueprint.product_blueprint, null, 2);
      } else {
        markdown += blueprint.product_blueprint;
      }
      markdown += `\n\n`;
    }

    if (blueprint.user_personas) {
      markdown += `## User Personas\n\n`;
      if (Array.isArray(blueprint.user_personas)) {
        blueprint.user_personas.forEach((persona: any, index: number) => {
          markdown += `### Persona ${index + 1}\n\n`;
          markdown += JSON.stringify(persona, null, 2);
          markdown += `\n\n`;
        });
      } else {
        markdown += JSON.stringify(blueprint.user_personas, null, 2);
      }
      markdown += `\n\n`;
    }

    if (blueprint.user_journey) {
      markdown += `## User Journey\n\n`;
      markdown += JSON.stringify(blueprint.user_journey, null, 2);
      markdown += `\n\n`;
    }

    if (blueprint.information_architecture) {
      markdown += `## Information Architecture\n\n`;
      markdown += JSON.stringify(blueprint.information_architecture, null, 2);
      markdown += `\n\n`;
    }

    if (blueprint.wireframes) {
      markdown += `## Wireframes & Layouts\n\n`;
      markdown += JSON.stringify(blueprint.wireframes, null, 2);
      markdown += `\n\n`;
    }

    if (blueprint.brand_identity) {
      markdown += `## Brand & Visual Identity\n\n`;
      markdown += JSON.stringify(blueprint.brand_identity, null, 2);
      markdown += `\n\n`;
    }

    if (blueprint.mvp_definition) {
      markdown += `## MVP Definition\n\n`;
      markdown += JSON.stringify(blueprint.mvp_definition, null, 2);
      markdown += `\n\n`;
    }

    if (blueprint.design_summary) {
      markdown += `## Design Summary\n\n`;
      markdown += JSON.stringify(blueprint.design_summary, null, 2);
      markdown += `\n\n`;
    }

    // Update rendered_markdown in database
    await supabase
      .from("design_blueprints")
      .update({ rendered_markdown: markdown })
      .eq("id", blueprint.id);

    if (format === "pdf") {
      // For PDF, return markdown for now (client-side PDF generation can be added later)
      return NextResponse.json({ markdown, format: "pdf" });
    }

    return NextResponse.json({ markdown, format: "markdown" });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export design blueprint" }, { status: 500 });
  }
}

