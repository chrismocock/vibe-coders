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
    const { projectId, buildPath, blueprintData, ideaContext } = body;

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
        (config as any)?.system_prompt_developer_pack_ai_tool ||
        (fallbackConfig as any)?.system_prompt_developer_pack_ai_tool ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    } else if (buildPath === "hire_dev") {
      systemPrompt =
        (config as any)?.system_prompt_developer_pack_hire_dev ||
        (fallbackConfig as any)?.system_prompt_developer_pack_hire_dev ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    } else {
      systemPrompt =
        (config as any)?.system_prompt_developer_pack ||
        (fallbackConfig as any)?.system_prompt_developer_pack ||
        config?.system_prompt ||
        fallbackConfig?.system_prompt ||
        "";
    }

    // Build context for AI
    let userPrompt = `Compile a developer pack for this project.\n\n`;
    if (ideaContext) {
      userPrompt += `Idea Context:\n${ideaContext}\n\n`;
    }
    if (buildPath) {
      userPrompt += `Build Path: ${buildPath}\n\n`;
    }
    if (blueprintData) {
      userPrompt += `Build Blueprint Data:\n${JSON.stringify(blueprintData, null, 2)}`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      buildPath: buildPath || "",
      blueprintData: blueprintData ? JSON.stringify(blueprintData) : "",
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

    // Parse result - could be markdown or JSON
    let parsedResult: any = {
      markdown: result,
      structured: null,
    };

    try {
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsedResult.structured = JSON.parse(jsonMatch[1]);
      } else {
        parsedResult.structured = JSON.parse(result);
      }
    } catch {
      // Keep as markdown only
    }

    // Update blueprint in database
    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("build_blueprints")
      .select("developer_pack, section_completion, last_ai_run")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const sectionCompletion = existing?.section_completion || {};
    sectionCompletion.developer_pack = true;
    
    const updateData: any = {
      developer_pack: parsedResult,
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

    // Update project stage to completed
    await supabase
      .from("project_stages")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("stage", "build")
      .eq("user_id", userId);

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to compile developer pack" },
      { status: 500 }
    );
  }
}

