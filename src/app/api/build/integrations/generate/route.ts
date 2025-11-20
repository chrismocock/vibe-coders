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
    const { projectId, buildPath, featureSpecs, mvpScope, ideaContext } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Get AI configuration
    const config = await getAIConfig("build");
    const fallbackConfig = defaultAIConfigs.build || {};

    // Get section-specific prompt based on build path
    let systemPrompt = "";
    if (buildPath === "ai_tool") {
      systemPrompt =
        (config as any)?.system_prompt_integrations_ai_tool ||
        (fallbackConfig as any)?.system_prompt_integrations_ai_tool ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    } else if (buildPath === "hire_dev") {
      systemPrompt =
        (config as any)?.system_prompt_integrations_hire_dev ||
        (fallbackConfig as any)?.system_prompt_integrations_hire_dev ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    } else {
      systemPrompt =
        (config as any)?.system_prompt_integrations_generate ||
        (fallbackConfig as any)?.system_prompt_integrations_generate ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    }

    // Build context for AI
    let userPrompt = `Generate integration recommendations for this project.\n\n`;
    if (ideaContext) {
      userPrompt += `Idea Context:\n${ideaContext}\n\n`;
    }
    if (buildPath) {
      userPrompt += `Build Path: ${buildPath}\n\n`;
    }
    if (featureSpecs) {
      userPrompt += `Feature Specs:\n${JSON.stringify(featureSpecs, null, 2)}\n\n`;
    }
    if (mvpScope) {
      userPrompt += `MVP Scope:\n${JSON.stringify(mvpScope, null, 2)}`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      buildPath: buildPath || "",
      featureSpecs: featureSpecs ? JSON.stringify(featureSpecs) : "",
      mvpScope: mvpScope ? JSON.stringify(mvpScope) : "",
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
        categories: [],
        recommendations: result,
      };
    }

    // Update blueprint in database
    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("build_blueprints")
      .select("integrations, section_completion, last_ai_run")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const sectionCompletion = existing?.section_completion || {};
    const updateData: any = {
      integrations: parsedResult,
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
      { error: "Failed to generate integrations" },
      { status: 500 }
    );
  }
}

