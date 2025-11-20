import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildLaunchContext, formatLaunchContextForPrompt } from "@/lib/launch/context";
import { parseAssetsResponse } from "@/lib/launch/parsers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, assetType, tone } = body;

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
      (config as any)?.system_prompt_launch_assets ||
      (fallbackConfig as any)?.system_prompt_launch_assets ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    let userPrompt = `Generate marketing assets.\n\n`;
    userPrompt += contextPrompt;

    if (assetType) {
      userPrompt += `Asset Type: ${assetType}\n\n`;
    }
    if (tone) {
      userPrompt += `Tone: ${tone}\n\n`;
    }

    // Include messaging framework if available
    if (launchBlueprint?.messaging_framework) {
      userPrompt += `Messaging Framework:\n${JSON.stringify(launchBlueprint.messaging_framework, null, 2)}\n\n`;
    }

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
    const parsedResult = parseAssetsResponse(result);

    // Merge with existing assets or replace
    const existingAssets = launchBlueprint?.marketing_assets?.assets || [];
    const updatedAssets = assetType
      ? existingAssets.map((a: any) =>
          a.type === assetType ? { ...a, ...parsedResult.assets[0], tone } : a
        )
      : [...existingAssets, ...parsedResult.assets];

    const sectionCompletion = launchBlueprint?.section_completion || {};
    await supabase
      .from("launch_blueprints")
      .upsert(
        {
          project_id: projectId,
          user_id: userId,
          marketing_assets: { assets: updatedAssets },
          last_ai_run: new Date().toISOString(),
          section_completion: sectionCompletion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      );

    return NextResponse.json({ result: { assets: updatedAssets } });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing assets" },
      { status: 500 }
    );
  }
}

