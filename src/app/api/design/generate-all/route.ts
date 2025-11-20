import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { projectId, ideaContext, validateData } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const sections = [
      "product_blueprint",
      "user_personas",
      "user_journey",
      "information_architecture",
      "wireframes",
      "brand_identity",
      "mvp_definition",
    ];

    // Generate all sections in parallel by calling the generate-section logic directly
    const generatePromises = sections.map(async (section) => {
      try {
        // Import and use the same logic as generate-section
        const OpenAI = (await import("openai")).default;
        const { getAIConfig, substitutePromptTemplate, defaultAIConfigs } = await import("@/lib/aiConfig");
        const { getSupabaseServer } = await import("@/lib/supabaseServer");

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const config = await getAIConfig("design");
        const fallbackConfig = defaultAIConfigs.design || {};

        const promptKey = `system_prompt_${section}` as keyof typeof config;
        const systemPrompt =
          (config as any)?.[promptKey] ||
          (fallbackConfig as any)?.[promptKey] ||
          config?.system_prompt ||
          fallbackConfig?.system_prompt ||
          "";

        let userPrompt = ideaContext || "";
        if (validateData) {
          userPrompt += `\n\nValidation Data:\n${JSON.stringify(validateData, null, 2)}`;
        }

        const userPromptWithVars = substitutePromptTemplate(userPrompt, {
          idea: ideaContext || "",
          validateData: validateData ? JSON.stringify(validateData) : "",
        });

        const completion = await openai.chat.completions.create({
          model: config?.model || fallbackConfig?.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptWithVars },
          ],
        });

        const result = completion.choices[0]?.message?.content || "";

        // Parse result based on section type
        let parsedResult: any = result;
        try {
          if (section === "user_personas" || section === "user_journey" || section === "mvp_definition") {
            parsedResult = JSON.parse(result);
          }
        } catch {
          parsedResult = result;
        }

        // Update blueprint in database
        const supabase = getSupabaseServer();
        const sectionFieldMap: Record<string, string> = {
          product_blueprint: "product_blueprint",
          user_personas: "user_personas",
          user_journey: "user_journey",
          information_architecture: "information_architecture",
          wireframes: "wireframes",
          brand_identity: "brand_identity",
          mvp_definition: "mvp_definition",
        };

        const fieldName = sectionFieldMap[section];
        const updateData: any = {
          [fieldName]: parsedResult,
          last_ai_run: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from("design_blueprints")
          .select("section_completion")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .single();

        const sectionCompletion = existing?.section_completion || {};
        sectionCompletion[section] = true;
        updateData.section_completion = sectionCompletion;

        await supabase
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
          );

        return { section, result: parsedResult };
      } catch (error: any) {
        console.error(`Error generating ${section}:`, error);
        return { section, error: error.message || "Failed to generate" };
      }
    });

    const results = await Promise.all(generatePromises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Some sections failed to generate",
          results,
          errors,
        },
        { status: 207 } // Multi-status
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Generate all error:", error);
    return NextResponse.json(
      { error: "Failed to generate design blueprint" },
      { status: 500 }
    );
  }
}

