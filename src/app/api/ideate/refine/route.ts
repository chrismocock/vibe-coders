import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import {
  improveIdea,
  PillarName,
  ProductOverview,
  generateImprovementDirections,
} from "@/server/ideate/refinementEngine";
import { normalizeInitialFeedbackData, ImprovementDirection } from "@/lib/ideate/pillars";
import { runIdeateInitialFeedback, IdeateInitialFeedbackInput } from "@/server/ideate/initialFeedback";
import { ZodError } from "zod";

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
  pendingImprovementDirections?: PendingImprovementDirections | null;
  [key: string]: unknown;
}

interface PendingImprovementDirections {
  targetPillar: PillarName;
  generatedAt: string;
  directions: ImprovementDirection[];
}

const CONFIDENCE_PRIORITY: Record<ImprovementDirection['confidence'], number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function parsePendingDirections(raw: unknown): PendingImprovementDirections | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as PendingImprovementDirections;
  if (
    !candidate ||
    !Array.isArray(candidate.directions) ||
    typeof (candidate as { targetPillar?: string }).targetPillar !== "string"
  ) {
    return null;
  }

  return {
    targetPillar: candidate.targetPillar as PillarName,
    generatedAt:
      typeof candidate.generatedAt === "string" && candidate.generatedAt
        ? candidate.generatedAt
        : new Date().toISOString(),
    directions: candidate.directions as ImprovementDirection[],
  };
}

function autoSelectDirection(directions: ImprovementDirection[]): ImprovementDirection | null {
  if (!Array.isArray(directions) || !directions.length) return null;
  const sorted = [...directions].sort((a, b) => {
    const confidenceDiff = CONFIDENCE_PRIORITY[b.confidence] - CONFIDENCE_PRIORITY[a.confidence];
    if (confidenceDiff !== 0) return confidenceDiff;
    return a.title.localeCompare(b.title);
  });
  return sorted[0] ?? null;
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

function detectWeakestPillar(scores: Record<string, { score: number }>): PillarName {
  let weakest: PillarName = "competition";
  let lowestScore = Number.POSITIVE_INFINITY;
  for (const [key, value] of Object.entries(scores)) {
    const numericScore = typeof value?.score === "number" ? value.score : 100;
    if (numericScore < lowestScore) {
      lowestScore = numericScore;
      weakest = key as PillarName;
    }
  }
  return weakest;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, targetPillar, selectedDirectionId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    const normalizedDirectionId =
      typeof selectedDirectionId === "string" && selectedDirectionId.trim().length
        ? selectedDirectionId.trim()
        : null;

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
    const pendingDirections = parsePendingDirections(outputJson?.pendingImprovementDirections);
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

    const target =
      (targetPillar as PillarName | undefined) ||
      detectWeakestPillar(currentFeedback.scores);
    const weaknessSummary =
      (currentFeedback.scores?.[target] && currentFeedback.scores[target].rationale) ||
      "No rationale provided.";
    const pendingForTarget =
      pendingDirections && pendingDirections.targetPillar === target ? pendingDirections : null;

    if (!normalizedDirectionId) {
      let directionsPayload = pendingForTarget;
      if (!directionsPayload) {
        const generatedDirections = await generateImprovementDirections({
          overview: baseOverview,
          pillar: target,
          weaknessSummary,
        });
        directionsPayload = {
          targetPillar: target,
          generatedAt: new Date().toISOString(),
          directions: generatedDirections,
        };

        const pendingOutput: IdeateStageOutput = {
          ...outputJson,
          pendingImprovementDirections: directionsPayload,
        };
        const { error: pendingSaveError } = await supabase
          .from("project_stages")
          .update({
            output: JSON.stringify(pendingOutput),
            updated_at: new Date().toISOString(),
          })
          .eq("id", stage.id);

        if (pendingSaveError) {
          console.error("Failed to store pending improvement directions:", pendingSaveError);
          throw new Error("Failed to store improvement directions. Please try again.");
        }
      }

      return NextResponse.json({
        status: "directions",
        targetPillar: target,
        requiresDirectionSelection: true,
        improvementDirections: directionsPayload.directions,
      });
    }

    let directionsPayload = pendingForTarget;
    if (!directionsPayload) {
      const generatedDirections = await generateImprovementDirections({
        overview: baseOverview,
        pillar: target,
        weaknessSummary,
      });
      directionsPayload = {
        targetPillar: target,
        generatedAt: new Date().toISOString(),
        directions: generatedDirections,
      };
    }

    let resolvedDirectionId = normalizedDirectionId;
    let selectedDirection: ImprovementDirection | null = null;

    if (resolvedDirectionId === "auto") {
      selectedDirection = autoSelectDirection(directionsPayload.directions);
      if (!selectedDirection) {
        return NextResponse.json(
          { error: "No improvement directions available for auto-selection." },
          { status: 400 },
        );
      }
      resolvedDirectionId = selectedDirection.id;
    } else {
      selectedDirection =
        directionsPayload.directions.find((direction) => direction.id === resolvedDirectionId) ?? null;
    }

    if (!selectedDirection) {
      return NextResponse.json(
        { error: "Selected direction was not found. Refresh directions and try again." },
        { status: 400 },
      );
    }

    const result = await improveIdea({
      overview: baseOverview,
      currentFeedback,
      feedbackInput,
      targetPillar: target,
      directions: directionsPayload.directions,
      selectedDirectionId: resolvedDirectionId,
    });

    const iterationEntry = {
      pillarImpacted: result.pillarImpacted,
      scoreDelta: result.scoreDelta,
      differences: result.differences,
      beforeSection: result.beforeSection,
      afterSection: result.afterSection,
      createdAt: new Date().toISOString(),
      selectedDirectionId: resolvedDirectionId,
      selectedDirectionTitle: selectedDirection.title,
      selectedDirectionConfidence: selectedDirection.confidence,
      selectedDirectionDescription: selectedDirection.description,
    };
    const existingIterations: unknown[] = Array.isArray(outputJson?.improvementIterations)
      ? outputJson.improvementIterations
      : [];

    const updatedOutput = {
      ...outputJson,
      refinedOverview: result.improvedOverview,
      initialFeedback: result.feedback,
      pillarScores: result.feedback.scores,
      latestDifferences: result.differences,
      improvementIterations: [...existingIterations, iterationEntry],
      pendingImprovementDirections: null,
    };

    const { error: updateError } = await supabase
      .from("project_stages")
      .update({
        output: JSON.stringify(updatedOutput),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage.id);

    if (updateError) {
      console.error("Failed to update project stage:", updateError);
      throw new Error("Failed to save refined idea to database");
    }

    const { error: insertError } = await supabase.from("idea_improvements").insert({
      project_id: projectId,
      pillar_improved: result.pillarImpacted,
      before_text: JSON.stringify(baseOverview),
      after_text: JSON.stringify(result.improvedOverview),
      score_delta: result.scoreDelta,
    });

    if (insertError) {
      console.error("Failed to insert idea improvement:", insertError);
      // Don't throw here - the refinement was successful, just logging failed
    }

    return NextResponse.json({
      improvedOverview: result.improvedOverview,
      differences: result.differences,
      pillarImpacted: result.pillarImpacted,
      scoreDelta: result.scoreDelta,
      beforeSection: result.beforeSection,
      afterSection: result.afterSection,
      updatedPillars: result.updatedPillars,
      updatedFeedback: result.feedback,
      improvementDirections: directionsPayload.directions,
      selectedDirectionId: resolvedDirectionId,
      selectedDirection,
      targetPillar: target,
    });
  } catch (error) {
    console.error("Ideate refine error:", error);
    let errorMessage = "Failed to refine idea";
    
    // Handle ZodError specifically - extract only the message, don't serialize the error object
    if (error instanceof ZodError) {
      errorMessage = "AI response validation failed. Please try again.";
      console.error("Zod validation error details:", error.issues);
    } else if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      // Check for validation-related errors
      if (error.message.includes('validation') || error.message.includes('schema') || error.message.includes('parse')) {
        errorMessage = "AI response validation failed. Please try again.";
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Always return a plain string error message - never serialize error objects
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
