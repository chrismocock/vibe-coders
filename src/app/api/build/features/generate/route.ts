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
      console.error("[Features Generate] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, featureName, featureId, featureDescription, mvpScope, designData, ideaContext, allFeatures } = body;

    requestContext = {
      projectId,
      featureName,
      featureId,
      hasMvpScope: !!mvpScope,
      hasDesignData: !!designData,
      hasIdeaContext: !!ideaContext,
      allFeaturesCount: allFeatures?.length || 0,
    };

    console.log("[Features Generate] Request received:", requestContext);

    if (!projectId) {
      console.error("[Features Generate] Missing projectId");
      return NextResponse.json(
        { error: "projectId is required", code: "MISSING_PROJECT_ID" },
        { status: 400 }
      );
    }

    if (!featureName && !allFeatures) {
      console.error("[Features Generate] Missing featureName or allFeatures");
      return NextResponse.json(
        { error: "featureName or allFeatures is required", code: "MISSING_FEATURE_NAME" },
        { status: 400 }
      );
    }

    // Get AI configuration
    const config = await getAIConfig("build");
    const fallbackConfig = defaultAIConfigs.build || {};

    console.log("[Features Generate] AI Config loaded:", {
      hasConfig: !!config,
      hasFallback: !!fallbackConfig,
      hasFeaturesPrompt: !!(config as any)?.system_prompt_features_generate,
    });

    // Get section-specific prompt with fallback
    let systemPrompt =
      (config as any)?.system_prompt_features_generate ||
      (fallbackConfig as any)?.system_prompt_features_generate;

    if (!systemPrompt) {
      console.warn("[Features Generate] Using fallback system prompt");
      systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || `You are an expert product owner and technical writer. For a given feature, generate a detailed user story, acceptance criteria, and potential edge cases.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "userStory": "As a [user type], I want to [action] so that [benefit].",
  "acceptanceCriteria": [
    "Criterion 1: [Specific, testable condition]",
    "Criterion 2: [Specific, testable condition]",
    "Criterion 3: [Specific, testable condition]"
  ],
  "edgeCases": [
    "Edge Case 1: [Description of an unusual scenario and expected behavior]",
    "Edge Case 2: [Description of another edge case]"
  ]
}

**Requirements:**
- 'userStory' should follow the standard format.
- 'acceptanceCriteria' should be a list of 3-5 specific, testable conditions.
- 'edgeCases' should list 1-3 potential unusual scenarios.
- All fields must be strings or arrays of strings.
- Base the output on the provided feature name, description, and overall project context.

Respond with ONLY the JSON object, no other text.`;
    }

    // Build context for AI
    let userPrompt = "";
    
    if (allFeatures && Array.isArray(allFeatures) && allFeatures.length > 0) {
      // Generate for multiple features
      userPrompt = `Generate user stories and acceptance criteria for the following ${allFeatures.length} features:\n\n`;
      allFeatures.forEach((f: any, idx: number) => {
        userPrompt += `${idx + 1}. ${f.name || "Unnamed Feature"}\n`;
        if (f.description) {
          userPrompt += `   Description: ${f.description}\n`;
        }
      });
      userPrompt += `\nGenerate a complete user story, acceptance criteria, and edge cases for EACH feature listed above. Return a JSON array where each element follows the structure specified in the system prompt.\n\n`;
    } else {
      // Generate for single feature
      userPrompt = `Generate user stories and acceptance criteria for this feature:\n\n`;
      userPrompt += `Feature Name: ${featureName}\n`;
      if (featureDescription) {
        userPrompt += `Feature Description: ${featureDescription}\n`;
      }
      userPrompt += `\n`;
    }

    if (ideaContext) {
      userPrompt += `Idea Context:\n${ideaContext}\n\n`;
    }
    if (mvpScope) {
      userPrompt += `MVP Scope:\n${JSON.stringify(mvpScope, null, 2)}\n\n`;
    }
    if (designData) {
      userPrompt += `Design Data:\n${JSON.stringify(designData, null, 2)}\n\n`;
    }

    const userPromptWithVars = substitutePromptTemplate(userPrompt, {
      idea: ideaContext || "",
      featureName: featureName || "",
      mvpScope: mvpScope ? JSON.stringify(mvpScope) : "",
      designData: designData ? JSON.stringify(designData) : "",
    });

    console.log("[Features Generate] Calling OpenAI API...");
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
    console.log("[Features Generate] Raw AI response length:", rawResult.length);
    console.log("[Features Generate] Raw AI response preview:", rawResult.substring(0, 300));

    // Parse result as JSON
    let parsedResult: any = {};
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = rawResult;
      const jsonMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      parsedResult = JSON.parse(jsonString);

      // Validate structure
      if (Array.isArray(parsedResult)) {
        // Multiple features returned
        console.log("[Features Generate] Parsed array result:", parsedResult.length, "features");
      } else if (parsedResult && typeof parsedResult === "object") {
        // Single feature returned
        console.log("[Features Generate] Parsed single feature result");
      } else {
        throw new Error("Parsed result is not an object or array");
      }
    } catch (parseError: any) {
      console.error("[Features Generate] JSON parsing error:", parseError.message);
      console.error("[Features Generate] Raw response:", rawResult);
      
      // Fallback: try to structure it as a single feature
      parsedResult = {
        description: featureDescription || "",
        userStory: rawResult.includes("As a") ? rawResult : "",
        acceptanceCriteria: [],
        edgeCases: [],
        error: "Failed to parse AI response as JSON",
      };
    }

    // Normalize the result structure
    if (Array.isArray(parsedResult)) {
      // Multiple features - ensure each has required fields
      parsedResult = parsedResult.map((f: any, idx: number) => {
        const feature = allFeatures?.[idx];
        return {
          name: feature?.name || f.name || `Feature ${idx + 1}`,
          description: feature?.description || f.description || "",
          userStory: f.userStory || f.user_story || "",
          acceptanceCriteria: Array.isArray(f.acceptanceCriteria || f.acceptance_criteria) 
            ? (f.acceptanceCriteria || f.acceptance_criteria).map((c: any) => 
                typeof c === "string" ? c : c.text || c
              )
            : [],
          edgeCases: Array.isArray(f.edgeCases || f.edge_cases)
            ? (f.edgeCases || f.edge_cases).map((e: any) => 
                typeof e === "string" ? e : e.text || e
              )
            : [],
        };
      });
    } else {
      // Single feature - ensure it has required fields
      parsedResult = {
        description: parsedResult.description || featureDescription || "",
        userStory: parsedResult.userStory || parsedResult.user_story || "",
        acceptanceCriteria: Array.isArray(parsedResult.acceptanceCriteria || parsedResult.acceptance_criteria)
          ? (parsedResult.acceptanceCriteria || parsedResult.acceptance_criteria).map((c: any) => 
              typeof c === "string" ? c : c.text || c
            )
          : [],
        edgeCases: Array.isArray(parsedResult.edgeCases || parsedResult.edge_cases)
          ? (parsedResult.edgeCases || parsedResult.edge_cases).map((e: any) => 
              typeof e === "string" ? e : e.text || e
            )
          : [],
      };
    }

    const duration = Date.now() - startTime;
    console.log("[Features Generate] Success:", {
      isArray: Array.isArray(parsedResult),
      resultCount: Array.isArray(parsedResult) ? parsedResult.length : 1,
      duration: `${duration}ms`,
    });

    // Return the result - let the frontend handle updating the state
    // Don't update the database here to avoid conflicts with frontend state
    return NextResponse.json({ result: parsedResult });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[Features Generate] Error:", {
      error: error.message,
      stack: error.stack,
      context: requestContext,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to generate feature specs",
        code: error.code || "UNKNOWN_ERROR",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

