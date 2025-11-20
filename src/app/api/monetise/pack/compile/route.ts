import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { buildMonetiseContext, formatMonetiseContextForPrompt } from "@/lib/monetise/context";
import { parsePackResponse } from "@/lib/monetise/parsers";

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

    // Get monetise blueprint
    const supabase = getSupabaseServer();
    const { data: monetiseBlueprint } = await supabase
      .from("monetise_blueprints")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (!monetiseBlueprint) {
      return NextResponse.json(
        { error: "Monetise blueprint not found. Complete previous sections first." },
        { status: 400 }
      );
    }

    // Build context
    const context = await buildMonetiseContext(projectId, userId, monetiseBlueprint);
    const contextPrompt = formatMonetiseContextForPrompt(context);

    // Get AI configuration
    const config = await getAIConfig("monetise");
    const fallbackConfig = defaultAIConfigs.monetise || {};

    // Get section-specific prompt
    const systemPrompt =
      (config as any)?.system_prompt_monetise_pack ||
      (fallbackConfig as any)?.system_prompt_monetise_pack ||
      config?.system_prompt ||
      fallbackConfig?.system_prompt ||
      "";

    // Build user prompt with all blueprint data
    let userPrompt = `Compile revenue pack with all monetisation data.\n\n`;
    userPrompt += contextPrompt;
    userPrompt += `\n\nCurrent Monetisation Data:\n`;
    userPrompt += `Monetisation Model: ${monetiseBlueprint.monetisation_model || "Not set"}\n`;
    if (monetiseBlueprint.pricing_strategy) {
      userPrompt += `Pricing Strategy: ${JSON.stringify(monetiseBlueprint.pricing_strategy, null, 2)}\n`;
    }
    if (monetiseBlueprint.offer_plan) {
      userPrompt += `Offer Plan: ${JSON.stringify(monetiseBlueprint.offer_plan, null, 2)}\n`;
    }
    if (monetiseBlueprint.checkout_flow) {
      userPrompt += `Checkout Flow: ${JSON.stringify(monetiseBlueprint.checkout_flow, null, 2)}\n`;
    }
    if (monetiseBlueprint.activation_blueprint) {
      userPrompt += `Activation Blueprint: ${JSON.stringify(monetiseBlueprint.activation_blueprint, null, 2)}\n`;
    }
    if (monetiseBlueprint.monetisation_assets) {
      userPrompt += `Monetisation Assets: ${JSON.stringify(monetiseBlueprint.monetisation_assets, null, 2)}\n`;
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
    const parsedResult = parsePackResponse(result);

    // Update blueprint and mark pack complete
    const sectionCompletion = {
      ...(monetiseBlueprint.section_completion || {}),
      pack: true,
    };
    
    const updateData: any = {
      revenue_pack: parsedResult,
      last_ai_run: new Date().toISOString(),
      section_completion: sectionCompletion,
    };

    await supabase
      .from("monetise_blueprints")
      .update(updateData)
      .eq("id", monetiseBlueprint.id);

    // Mark Monetise stage complete in project_stages
    await supabase
      .from("project_stages")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("stage", "monetise");

    return NextResponse.json({ result: parsedResult });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to compile revenue pack" },
      { status: 500 }
    );
  }
}

