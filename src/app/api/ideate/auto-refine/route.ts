import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import {
  autoImproveIdea,
  PillarResult,
  ProductOverview,
} from "@/server/ideate/refinementEngine";

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildFallbackOverview(input: Record<string, any>, reviewText?: string): ProductOverview {
  const ideaText =
    input?.userInput ||
    input?.selectedIdea?.description ||
    input?.selectedIdea?.title ||
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

function mapPillars(scores?: Record<string, { score?: number; rationale?: string }>): PillarResult[] {
  const defaults: PillarResult[] = [
    { pillar: "audienceFit", score: 50 },
    { pillar: "competition", score: 50 },
    { pillar: "marketDemand", score: 50 },
    { pillar: "feasibility", score: 50 },
    { pillar: "pricingPotential", score: 50 },
  ];

  if (!scores) return defaults;

  return defaults.map((base) => {
    const found = scores[base.pillar];
    if (!found) return base;
    const normalizedScore = typeof found.score === "number" ? Math.max(0, Math.min(100, Math.round(found.score))) : base.score;
    return {
      pillar: base.pillar,
      score: normalizedScore,
      rationale: found.rationale,
    };
  });
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

    const inputJson = parseJson<Record<string, any>>(stage.input, {});
    const outputJson = parseJson<Record<string, any>>(stage.output, {});
    const reviewText = typeof outputJson?.aiReview === "string" ? outputJson.aiReview : "";
    const baseOverview =
      (outputJson?.refinedOverview as ProductOverview | undefined) ||
      buildFallbackOverview(inputJson, reviewText);
    const basePillars = mapPillars(outputJson?.initialFeedback?.scores || outputJson?.pillarScores);

    const result = await autoImproveIdea(baseOverview, basePillars, targetScore);

    const updatedOutput = {
      ...outputJson,
      refinedOverview: result.finalOverview,
      pillarScores: result.pillars,
      latestDifferences: result.iterations.at(-1)?.differences ?? [],
      improvementIterations: result.iterations,
    };

    await supabase
      .from("project_stages")
      .update({
        output: JSON.stringify(updatedOutput),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage.id);

    if (result.iterations.length) {
      const rows = result.iterations.map((iteration) => ({
        project_id: projectId,
        pillar_improved: iteration.pillarImpacted,
        before_text: JSON.stringify(baseOverview),
        after_text: JSON.stringify(iteration.improvedOverview),
        score_delta: iteration.expectedScoreIncrease,
      }));
      await supabase.from("idea_improvements").insert(rows);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ideate auto-refine error:", error);
    return NextResponse.json({ error: "Failed to auto-refine idea" }, { status: 500 });
  }
}

