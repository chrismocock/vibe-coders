import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const DESIGN_SECTIONS = [
  "product_blueprint",
  "user_personas",
  "user_journey",
  "information_architecture",
  "wireframes",
  "brand_identity",
  "mvp_definition",
] as const;

type DesignSection = (typeof DESIGN_SECTIONS)[number];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, section, ideaContext, validateData } = body;

    if (!projectId || !section) {
      return NextResponse.json(
        { error: "projectId and section are required" },
        { status: 400 }
      );
    }

    if (!DESIGN_SECTIONS.includes(section as DesignSection)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    // Get AI configuration
    const config = await getAIConfig("design");
    const fallbackConfig = defaultAIConfigs.design || {};

    // Get section-specific prompt
    const promptKey = `system_prompt_${section}` as keyof typeof config;
    const systemPrompt =
      (config as any)?.[promptKey] ||
      (fallbackConfig as any)?.[promptKey] ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    // Build context for AI
    let userPrompt = ideaContext || "";
    if (validateData) {
      userPrompt += `\n\nValidation Data:\n${JSON.stringify(validateData, null, 2)}`;
    }

    // Substitute variables in prompts
    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      validateData: validateData ? JSON.stringify(validateData) : "",
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

    // Parse result based on section type
    let parsedResult: any = result;
    try {
      // Try to parse as JSON for structured sections
      if (section === "product_blueprint" || section === "user_personas" || section === "user_journey" || section === "information_architecture" || section === "wireframes" || section === "brand_identity" || section === "mvp_definition") {
        parsedResult = JSON.parse(result);
      }
    } catch {
      // If parsing fails, use raw text
      parsedResult = result;
    }

    // Update blueprint in database
    const supabase = getSupabaseServer();
    const sectionFieldMap: Record<DesignSection, string> = {
      product_blueprint: "product_blueprint",
      user_personas: "user_personas",
      user_journey: "user_journey",
      information_architecture: "information_architecture",
      wireframes: "wireframes",
      brand_identity: "brand_identity",
      mvp_definition: "mvp_definition",
    };

    const fieldName = sectionFieldMap[section as DesignSection];
    const updateData: any = {
      [fieldName]: parsedResult,
      last_ai_run: new Date().toISOString(),
    };

    // Update section completion
    const { data: existing } = await supabase
      .from("design_blueprints")
      .select("section_completion")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const sectionCompletion = existing?.section_completion || {};
    sectionCompletion[section] = true;
    updateData.section_completion = sectionCompletion;

    const { data: blueprint } = await supabase
      .from("design_blueprints")
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
      )
      .select("*")
      .single();

    return NextResponse.json({ result: parsedResult, blueprint });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate design section" },
      { status: 500 }
    );
  }
}

