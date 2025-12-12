import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { autoImproveIdea, ProductOverview } from "@/server/ideate/refinementEngine";
import { normalizeInitialFeedbackData } from "@/lib/ideate/pillars";
import { runIdeateInitialFeedback, IdeateInitialFeedbackInput } from "@/server/ideate/initialFeedback";

interface IdeateStageInput {
  mode?: string | null;
  userInput?: string | null;
  selectedIdea?: unknown;
  targetMarket?: string | null;
  targetCountry?: string | null;
  budget?: string | null;
  timescales?: string | null;
  [key: string]: unknown;
}

interface IdeateStageOutput {
  aiReview?: string | null;
  refinedOverview?: ProductOverview;
  initialFeedback?: unknown;
  pillarScores?: Record<string, { score?: number; rationale?: string }>;
  improvementIterations?: unknown[];
  [key: string]: unknown;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildFallbackOverview(input: IdeateStageInput, reviewText?: string): ProductOverview {
  const selectedIdea = (input?.selectedIdea as { description?: string; title?: string } | null) || null;
  const ideaText =
    (typeof input?.userInput === "string" && input.userInput) ||
    selectedIdea?.description ||
    selectedIdea?.title ||
    reviewText ||
    "No description provided.";

  const condensed = (text: string, minLen: number) =>
    text && text.length >= minLen ? text : `${text || "Improved idea"} — refined for clarity`;

  return {
    refinedPitch: condensed(ideaText, 20),
    problemSummary: condensed(reviewText || ideaText, 30),
    personas: [
      {
        name: "Primary Persona",
        summary: "Persona refined from the current idea context.",
        needs: ["Clarity on value", "Actionable outcomes"],
      },
    ],
    solution: condensed(ideaText, 40),
    coreFeatures: [condensed("Core features clarified from the idea", 20)],
    uniqueValue: condensed("Differentiation sharpened against competitors", 25),
    competition: condensed("Competition positioning summarized", 25),
    risks: [
      {
        risk: condensed("Key risk noted from current description", 20),
        mitigation: condensed("Mitigation approach proposed", 20),
      },
    ],
    monetisation: [
      {
        model: "Subscription",
        description: "Baseline monetisation model derived from the idea.",
      },
    ],
    marketSize: condensed("Market size directional estimate", 25),
    buildNotes: condensed("Build considerations captured", 25),
  };
}

function buildFeedbackInput(input: IdeateStageInput): IdeateInitialFeedbackInput {
  const mode = typeof input?.mode === "string" ? input.mode : null;
  return {
    mode,
    userInput: mode === "surprise-me" ? null : (typeof input?.userInput === "string" ? input.userInput : null),
    selectedIdea: mode === "surprise-me" ? (input?.selectedIdea ?? null) : null,
    targetMarket: typeof input?.targetMarket === "string" ? input.targetMarket : null,
    targetCountry: typeof input?.targetCountry === "string" ? input.targetCountry : null,
    budget: typeof input?.budget === "string" ? input.budget : null,
    timescales: typeof input?.timescales === "string" ? input.timescales : null,
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, targetScore = 95 } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: stage, error } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("stage", "ideate")
      .single();

    if (error || !stage) {
      return NextResponse.json({ error: "Ideate stage not found" }, { status: 404 });
    }

    const inputJson = parseJson<IdeateStageInput>(stage.input, {});
    const outputJson = parseJson<IdeateStageOutput>(stage.output, {});
    const reviewText = typeof outputJson?.aiReview === "string" ? outputJson.aiReview : "";
    const baseOverview =
      (outputJson?.refinedOverview as ProductOverview | undefined) ||
      buildFallbackOverview(inputJson, reviewText);
    const feedbackInput = buildFeedbackInput(inputJson);
    let currentFeedback = outputJson?.initialFeedback
      ? normalizeInitialFeedbackData(outputJson.initialFeedback)
      : null;
    if (!currentFeedback) {
      const fallbackReview = reviewText?.trim()?.length
        ? reviewText
        : JSON.stringify(baseOverview, null, 2);
      currentFeedback = await runIdeateInitialFeedback(feedbackInput, fallbackReview);
    }
    if (!currentFeedback) {
      throw new Error("Unable to generate current ideate feedback");
    }

    const result = await autoImproveIdea({
      overview: baseOverview,
      currentFeedback,
      feedbackInput,
      targetScore,
    });

    const iterationEntries = result.iterations.map((iteration) => ({
      pillarImpacted: iteration.pillarImpacted,
      scoreDelta: iteration.scoreDelta,
      differences: iteration.differences,
      beforeSection: iteration.beforeSection,
      afterSection: iteration.afterSection,
      createdAt: new Date().toISOString(),
    }));
    const existingIterations = Array.isArray(outputJson?.improvementIterations)
      ? outputJson.improvementIterations
      : [];

    const updatedOutput = {
      ...outputJson,
      refinedOverview: result.finalOverview,
      initialFeedback: result.finalFeedback,
      pillarScores: result.finalFeedback.scores,
      latestDifferences: result.iterations.at(-1)?.differences ?? [],
      improvementIterations: [...existingIterations, ...iterationEntries],
    };

    await supabase
      .from("project_stages")
      .update({
        output: JSON.stringify(updatedOutput),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage.id);

    if (result.iterations.length) {
      const rows = [];
      let snapshot: ProductOverview = baseOverview;
      for (const iteration of result.iterations) {
        rows.push({
          project_id: projectId,
          pillar_improved: iteration.pillarImpacted,
          before_text: JSON.stringify(snapshot),
          after_text: JSON.stringify(iteration.improvedOverview),
          score_delta: iteration.scoreDelta,
        });
        snapshot = iteration.improvedOverview;
      }
      await supabase.from("idea_improvements").insert(rows);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ideate auto-refine error:", error);
    return NextResponse.json({ error: "Failed to auto-refine idea" }, { status: 500 });
  }
}

