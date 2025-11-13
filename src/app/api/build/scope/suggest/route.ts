import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";
import { getSupabaseServer } from "@/lib/supabaseServer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  const startTime = Date.now();
  let requestContext: any = {};

  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("[MVP Scope Suggest] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, designData, ideaContext, validateData, currentFeatures, buildPath } = body;

    requestContext = {
      projectId,
      hasDesignData: !!designData,
      hasIdeaContext: !!ideaContext,
      hasValidateData: !!validateData,
      currentFeaturesCount: currentFeatures?.length || 0,
      buildPath,
    };

    console.log("[MVP Scope Suggest] Request received:", requestContext);

    if (!projectId) {
      console.error("[MVP Scope Suggest] Missing projectId");
      return NextResponse.json(
        { error: "projectId is required", code: "MISSING_PROJECT_ID" },
        { status: 400 }
      );
    }

    // Get AI configuration
    const config = await getAIConfig("build");
    const fallbackConfig = defaultAIConfigs.build || {};

    console.log("[MVP Scope Suggest] AI Config loaded:", {
      hasConfig: !!config,
      hasFallback: !!fallbackConfig,
      hasScopePrompt: !!(config as any)?.system_prompt_scope_suggest,
      hasFallbackScopePrompt: !!(fallbackConfig as any)?.system_prompt_scope_suggest,
    });

    // Get section-specific prompt with better fallback
    let systemPrompt =
      (config as any)?.system_prompt_scope_suggest ||
      (fallbackConfig as any)?.system_prompt_scope_suggest;

    if (!systemPrompt) {
      console.warn("[MVP Scope Suggest] Using fallback system prompt");
      systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || `You are an expert product manager specializing in MVP scope definition. Generate prioritized feature suggestions organized by tier (Must Have, Should Have, Future).

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "features": [
    {
      "name": "Feature Name",
      "description": "Brief description",
      "tier": "must" | "should" | "future",
      "notes": "Additional context or rationale"
    }
  ]
}

**Requirements:**
- Generate 8-15 features total
- Must Have: 3-5 critical features for MVP
- Should Have: 3-5 important but not critical features
- Future: 2-5 nice-to-have features
- Each feature must have a clear name and description
- Base recommendations on the design MVP data and validation insights
- Be specific and actionable

Respond with ONLY the JSON object, no other text.`;
    }

    if (!systemPrompt || systemPrompt.trim() === "") {
      console.error("[MVP Scope Suggest] No system prompt available");
      return NextResponse.json(
        {
          error: "AI configuration not found. Please ensure Build stage prompts are seeded.",
          code: "MISSING_AI_CONFIG",
        },
        { status: 500 }
      );
    }

    // Build context for AI
    let userPrompt = ideaContext || "Generate MVP feature suggestions for a new product.";
    if (designData) {
      userPrompt += `\n\nDesign Data:\n${JSON.stringify(designData, null, 2)}`;
    }
    if (validateData) {
      userPrompt += `\n\nValidation Data:\n${JSON.stringify(validateData, null, 2)}`;
    }
    if (currentFeatures && Array.isArray(currentFeatures) && currentFeatures.length > 0) {
      userPrompt += `\n\nCurrent Features (do not duplicate these):\n${JSON.stringify(currentFeatures.map((f: any) => f.name), null, 2)}`;
    }
    if (buildPath) {
      userPrompt += `\n\nBuild Path: ${buildPath}`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      designData: designData ? JSON.stringify(designData) : "",
      validateData: validateData ? JSON.stringify(validateData) : "",
    });

    console.log("[MVP Scope Suggest] Calling OpenAI API...");
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

    const rawResult = completion.choices[0]?.message?.content || "";
    console.log("[MVP Scope Suggest] Raw AI response length:", rawResult.length);
    console.log("[MVP Scope Suggest] Raw AI response preview:", rawResult.substring(0, 200));

    // Parse result as JSON
    let parsedResult: any = { features: [] };
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = rawResult;
      const jsonMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      parsedResult = JSON.parse(jsonString);

      // Validate structure
      if (!parsedResult || typeof parsedResult !== "object") {
        throw new Error("Parsed result is not an object");
      }

      // Ensure features is an array
      if (!Array.isArray(parsedResult.features)) {
        if (Array.isArray(parsedResult)) {
          // If the result itself is an array, wrap it
          parsedResult = { features: parsedResult };
        } else {
          console.warn("[MVP Scope Suggest] Features is not an array, defaulting to empty");
          parsedResult.features = [];
        }
      }

      console.log("[MVP Scope Suggest] Parsed result:", {
        featuresCount: parsedResult.features?.length || 0,
        hasFeatures: Array.isArray(parsedResult.features),
      });
    } catch (parseError: any) {
      console.error("[MVP Scope Suggest] JSON parsing error:", parseError.message);
      console.error("[MVP Scope Suggest] Raw response:", rawResult);
      
      // Try to extract features from text if JSON parsing fails
      const featureMatches = rawResult.match(/(?:^|\n)\s*[-*]\s*(.+?)(?:\n|$)/g);
      if (featureMatches && featureMatches.length > 0) {
        parsedResult.features = featureMatches.slice(0, 10).map((match: string, idx: number) => ({
          name: match.replace(/^[\s\n]*[-*]\s*/, "").trim(),
          description: "",
          tier: idx < 3 ? "must" : idx < 6 ? "should" : "future",
          notes: "",
        }));
        console.log("[MVP Scope Suggest] Extracted features from text:", parsedResult.features.length);
      } else {
        parsedResult = { features: [], notes: rawResult, error: "Failed to parse AI response as JSON" };
      }
    }

    // Validate features array has required fields
    if (Array.isArray(parsedResult.features)) {
      parsedResult.features = parsedResult.features
        .filter((f: any) => f && (f.name || f.title))
        .map((f: any) => ({
          name: f.name || f.title || "Unnamed Feature",
          description: f.description || "",
          tier: f.tier || "should",
          notes: f.notes || f.rationale || "",
        }));
    }

    // Update blueprint in database
    const supabase = getSupabaseServer();
    const { data: existing } = await supabase
      .from("build_blueprints")
      .select("mvp_scope, section_completion, last_ai_run")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    const currentScope = existing?.mvp_scope || { features: [] };
    const updatedScope = {
      ...currentScope,
      suggestedFeatures: parsedResult.features || [],
      lastSuggested: new Date().toISOString(),
    };

    const sectionCompletion = existing?.section_completion || {};
    const updateData: any = {
      mvp_scope: updatedScope,
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

    const duration = Date.now() - startTime;
    console.log("[MVP Scope Suggest] Success:", {
      featuresCount: parsedResult.features?.length || 0,
      duration: `${duration}ms`,
    });

    return NextResponse.json({ result: parsedResult });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[MVP Scope Suggest] Error:", {
      error: error.message,
      stack: error.stack,
      context: requestContext,
      duration: `${duration}ms`,
    });

    // Return structured error response
    return NextResponse.json(
      {
        error: error.message || "Failed to suggest MVP scope",
        code: error.code || "UNKNOWN_ERROR",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

