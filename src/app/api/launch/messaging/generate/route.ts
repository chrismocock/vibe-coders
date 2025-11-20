import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildLaunchContext, formatLaunchContextForPrompt } from "@/lib/launch/context";
import { parseMessagingResponse } from "@/lib/launch/parsers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
    const { data: launchBlueprint } = await supabase
      .from("launch_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const context = await buildLaunchContext(projectId, userId, launchBlueprint || undefined);
    const contextPrompt = formatLaunchContextForPrompt(context);

    const config = await getAIConfig("launch");
    const fallbackConfig = defaultAIConfigs.launch || {};

    const systemPrompt =
      (config as any)?.system_prompt_launch_messaging ||
      (fallbackConfig as any)?.system_prompt_launch_messaging ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    let userPrompt = `Generate a messaging framework.\n\n`;
    userPrompt += contextPrompt;

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: context.ideaContext || "",
    });

    const completion = await openai.chat.completions.create({
      model: config?.model || fallbackConfig?.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptWithVars },
      ],
    });

    const result = completion.choices[0]?.message?.content || "";
    const parsedResult = parseMessagingResponse(result);

    const sectionCompletion = launchBlueprint?.section_completion || {};
    await supabase
      .from("launch_blueprints")
      .upsert(
        {
          project_id: projectId,
          user_id: userId,
          messaging_framework: parsedResult,
          last_ai_run: new Date().toISOString(),
          section_completion: sectionCompletion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      );

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate messaging framework" },
      { status: 500 }
    );
  }
}

