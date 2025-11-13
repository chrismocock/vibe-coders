import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildMonetiseContext, formatMonetiseContextForPrompt } from "@/lib/monetise/context";
import { parsePricingResponse } from "@/lib/monetise/parsers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, lowerPriceSensitivity, showCompetitorAnalysis } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Get monetise blueprint
    const supabase = getSupabaseServer();
    const { data: monetiseBlueprint } = await supabase
      .from("monetise_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    // Build context
    const context = await buildMonetiseContext(projectId, userId, monetiseBlueprint || undefined);
    const contextPrompt = formatMonetiseContextForPrompt(context);

    // Get AI configuration
    const config = await getAIConfig("monetise");
    const fallbackConfig = defaultAIConfigs.monetise || {};

    // Get section-specific prompt
    const systemPrompt =
      (config as any)?.system_prompt_monetise_pricing ||
      (fallbackConfig as any)?.system_prompt_monetise_pricing ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    // Build user prompt
    let userPrompt = `Generate pricing strategy.\n\n`;
    userPrompt += contextPrompt;
    
    if (lowerPriceSensitivity) {
      userPrompt += `\nNote: User prefers lower price sensitivity - consider more affordable pricing.\n`;
    }
    if (showCompetitorAnalysis) {
      userPrompt += `\nInclude detailed competitor analysis.\n`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: context.ideaContext || "",
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
    const parsedResult = parsePricingResponse(result);

    // Update blueprint
    const sectionCompletion = monetiseBlueprint?.section_completion || {};
    const updateData: any = {
      pricing_strategy: parsedResult,
      last_ai_run: new Date().toISOString(),
      section_completion: sectionCompletion,
    };

    await supabase
      .from("monetise_blueprints")
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
      { error: "Failed to generate pricing strategy" },
      { status: 500 }
    );
  }
}

