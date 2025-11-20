import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, designData, featureSpecs, ideaContext } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Get AI configuration
    const config = await getAIConfig("build");
    const fallbackConfig = defaultAIConfigs.build || {};

    // Get section-specific prompt
    const systemPrompt =
      (config as any)?.system_prompt_screens_checklist ||
      (fallbackConfig as any)?.system_prompt_screens_checklist ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    // Build context for AI
    let userPrompt = `Generate a build checklist for screens and components.\n\n`;
    if (ideaContext) {
      userPrompt += `Idea Context:\n${ideaContext}\n\n`;
    }
    if (designData) {
      userPrompt += `Design Data:\n${JSON.stringify(designData, null, 2)}\n\n`;
    }
    if (featureSpecs) {
      userPrompt += `Feature Specs:\n${JSON.stringify(featureSpecs, null, 2)}`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      designData: designData ? JSON.stringify(designData) : "",
      featureSpecs: featureSpecs ? JSON.stringify(featureSpecs) : "",
    });

    const completion = await openai.chat.completions.create({
      model: config?.model || fallbackConfig?.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPromptWithVars,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content || "";

    // Parse result as JSON
    let parsedResult: any = result;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      // If parsing fails, structure it
      parsedResult = {
        screens: [],
        checklist: result,
      };
    }

    // Update blueprint in database
    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("build_blueprints")
      .select("screens_components, section_completion, last_ai_run")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const currentScreens = existing?.screens_components || { screens: [], checklist: [] };
    const updatedScreens = {
      ...currentScreens,
      checklist: parsedResult.checklist || parsedResult,
      lastGenerated: new Date().toISOString(),
    };

    const sectionCompletion = existing?.section_completion || {};
    const updateData: any = {
      screens_components: updatedScreens,
      last_ai_run: new Date().toISOString(),
      section_completion: sectionCompletion,
    };

    await supabase
      .from("build_blueprints")
      .upsert(
        {
          project_id: projectId,
          user_id: userId,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "project_id",
        }
      );

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate screens checklist" },
      { status: 500 }
    );
  }
}

