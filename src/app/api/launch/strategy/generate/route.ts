import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildLaunchContext, formatLaunchContextForPrompt } from "@/lib/launch/context";
import { parseStrategyResponse } from "@/lib/launch/parsers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, launchPathChoice, timeframe } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Get launch blueprint
    const supabase = getSupabaseServer();
    const { data: launchBlueprint } = await supabase
      .from("launch_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    // Build context
    const context = await buildLaunchContext(projectId, userId, launchBlueprint || undefined);
    const contextPrompt = formatLaunchContextForPrompt(context);

    // Get AI configuration
    const config = await getAIConfig("launch");
    const fallbackConfig = defaultAIConfigs.launch || {};

    // Get section-specific prompt
    const systemPrompt =
      (config as any)?.system_prompt_launch_strategy ||
      (fallbackConfig as any)?.system_prompt_launch_strategy ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    // Build user prompt
    let userPrompt = `Generate a launch strategy plan.\n\n`;
    userPrompt += contextPrompt;
    
    if (launchPathChoice) {
      userPrompt += `Launch Path Choice: ${launchPathChoice}\n\n`;
    }
    if (timeframe) {
      userPrompt += `Preferred Timeframe: ${timeframe} days\n\n`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: context.ideaContext || "",
      launchPathChoice: launchPathChoice || context.launchPathChoice || "",
      timeframe: timeframe?.toString() || "7",
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
    const parsedResult = parseStrategyResponse(result);

    // Update blueprint
    const sectionCompletion = launchBlueprint?.section_completion || {};
    const updateData: any = {
      strategy_plan: parsedResult,
      last_ai_run: new Date().toISOString(),
      section_completion: sectionCompletion,
    };

    if (launchPathChoice) {
      updateData.launch_path_choice = launchPathChoice;
    }

    await supabase
      .from("launch_blueprints")
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
      { error: "Failed to generate launch strategy" },
      { status: 500 }
    );
  }
}

