import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildLaunchContext, formatLaunchContextForPrompt } from "@/lib/launch/context";
import { parsePackResponse } from "@/lib/launch/parsers";

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

    if (!launchBlueprint) {
      return NextResponse.json(
        { error: "Launch blueprint not found. Complete other sections first." },
        { status: 400 }
      );
    }

    // Check if all sections are complete
    const sectionCompletion = launchBlueprint.section_completion || {};
    const requiredSections = ["overview", "strategy", "messaging", "landing", "adopters", "assets", "metrics"];
    const incompleteSections = requiredSections.filter((s) => !sectionCompletion[s]);

    if (incompleteSections.length > 0) {
      return NextResponse.json(
        { error: `Please complete these sections first: ${incompleteSections.join(", ")}` },
        { status: 400 }
      );
    }

    const context = await buildLaunchContext(projectId, userId, launchBlueprint);
    const contextPrompt = formatLaunchContextForPrompt(context);

    const config = await getAIConfig("launch");
    const fallbackConfig = defaultAIConfigs.launch || {};

    const systemPrompt =
      (config as any)?.system_prompt_launch_pack ||
      (fallbackConfig as any)?.system_prompt_launch_pack ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    let userPrompt = `Compile a comprehensive launch pack from all launch data.\n\n`;
    userPrompt += contextPrompt;
    userPrompt += `\nLaunch Blueprint Data:\n${JSON.stringify(launchBlueprint, null, 2)}`;

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
    const parsedResult = parsePackResponse(result);

    // Update blueprint with launch pack
    await supabase
      .from("launch_blueprints")
      .update({
        launch_pack: parsedResult,
        last_ai_run: new Date().toISOString(),
        section_completion: { ...sectionCompletion, pack: true },
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("user_id", userId);

    // Update project_stages to mark launch as completed
    await supabase
      .from("project_stages")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("stage", "launch");

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to compile launch pack" },
      { status: 500 }
    );
  }
}

