import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const PillarEnum = z.enum([
  "Audience Fit",
  "Competition",
  "Market Demand",
  "Feasibility",
  "Pricing Potential",
]);

type PillarLabel = z.infer<typeof PillarEnum>;

const SuggestionSchema = z.object({
  pillar: PillarEnum,
  issue: z.string().min(4),
  rationale: z.string().min(4),
  suggestion: z.string().min(8),
  estimatedImpact: z.number(),
});

const ResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema),
});

const PILLAR_NAME_MAP: Record<string, PillarLabel> = {
  "audience fit": "Audience Fit",
  audience: "Audience Fit",
  "competition": "Competition",
  competitors: "Competition",
  "market demand": "Market Demand",
  market: "Market Demand",
  demand: "Market Demand",
  feasibility: "Feasibility",
  "pricing potential": "Pricing Potential",
  pricing: "Pricing Potential",
};

const MAX_GENERATION_ATTEMPTS = 3;

interface PillarWeakness {
  pillar: PillarLabel;
  score: number;
  rationale: string;
  weaknesses: string[];
}

const normalizePillarLabel = (raw?: string | null): PillarLabel | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (PillarEnum.options.includes(trimmed as PillarLabel)) {
    return trimmed as PillarLabel;
  }
  return PILLAR_NAME_MAP[trimmed.toLowerCase()] ?? null;
};

const extractKeywords = (text?: string | null) => {
  if (!text) return [];
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 5),
    ),
  );
};

const referencesRationale = (referenceText: string, suggestionText: string) => {
  const keywords = extractKeywords(referenceText);
  if (!keywords.length) {
    return true;
  }
  const haystack = suggestionText.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
};

const serializeWeaknesses = (weaknesses: PillarWeakness[]) =>
  weaknesses
    .map(
      (weakness) =>
        `Pillar: ${weakness.pillar}\nScore: ${weakness.score}\nRationale: ${
          weakness.rationale || "n/a"
        }${
          weakness.weaknesses.length ? `\nWeaknesses: ${weakness.weaknesses.join("; ")}` : ""
        }`,
    )
    .join("\n\n");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idea, pillarWeaknesses, pillarScores } = body || {};

    if (!idea || typeof idea !== "string") {
      return NextResponse.json({ error: "Idea text is required" }, { status: 400 });
    }

    if (!Array.isArray(pillarWeaknesses) || pillarWeaknesses.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const formattedWeaknesses: PillarWeakness[] = pillarWeaknesses
      .map((weakness: any) => {
        if (!weakness || typeof weakness !== "object") return null;
        const normalizedPillar = normalizePillarLabel(weakness.pillar);
        if (!normalizedPillar || typeof weakness.score !== "number") return null;
        const sanitizedRationale =
          typeof weakness.rationale === "string" ? weakness.rationale.trim() : "";
        const weaknessNotes = Array.isArray(weakness.weaknesses)
          ? (weakness.weaknesses as any[])
              .map((item) => (typeof item === "string" ? item : ""))
              .filter(Boolean)
          : [];
        return {
          pillar: normalizedPillar,
          score: weakness.score,
          rationale: sanitizedRationale,
          weaknesses: weaknessNotes.slice(0, 3),
        };
      })
      .filter(Boolean) as PillarWeakness[];

    if (!formattedWeaknesses.length) {
      return NextResponse.json({ suggestions: [] });
    }

    const scoresSummary =
      pillarScores && typeof pillarScores === "object"
        ? Object.entries(pillarScores)
            .map(([key, value]) => {
              if (typeof value === "number") {
                return `${key}: ${value}`;
              }
              if (typeof value === "object" && value && typeof (value as any).score === "number") {
                return `${key}: ${(value as any).score}`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n")
        : null;

    const weaknessSummary = serializeWeaknesses(formattedWeaknesses);

    const systemPrompt = `You are a strict startup validation coach.
Return ONLY valid JSON in this schema:
{
  "suggestions": [
    {
      "pillar": "Audience Fit" | "Competition" | "Market Demand" | "Feasibility" | "Pricing Potential",
      "issue": "<short text>",
      "rationale": "<reference the validation rationale>",
      "suggestion": "<specific change>",
      "estimatedImpact": <number>
    }
  ]
}
Rules:
- Generate ONE suggestion per weak pillar and keep array length identical to pillarWeaknesses.
- Mirror the pillar name exactly.
- Reference the provided rationale directly.
- No extra text, markdown, or bullet points.
- Any schema violation invalidates the response.`;

    const userPrompt = `Startup idea:\n${idea}\n\nOverall pillar scores:\n${
      scoresSummary || "Not provided"
    }\n\nWeak pillars needing improvement:\n${weaknessSummary}\n\nInstructions:\n- Generate ONE improvement suggestion for EACH entry in pillarWeaknesses.\n- Explicitly reference the weakness rationale when summarising the issue.\n- Propose a concrete edit to the idea that will improve that pillar.\n- Follow the JSON schema exactly with no filler.`;

    const generateRawSuggestions = async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      return content;
    };

    const validateAndClean = (raw: string) => {
      const parsed = ResponseSchema.parse(JSON.parse(raw));
      if (parsed.suggestions.length !== formattedWeaknesses.length) {
        throw new Error("Incorrect number of suggestions returned");
      }

      const allowedWeaknessMap = new Map(formattedWeaknesses.map((w) => [w.pillar, w]));
      const seen = new Set<PillarLabel>();

      return parsed.suggestions.map((suggestion) => {
        const normalizedPillar = normalizePillarLabel(suggestion.pillar);
        if (!normalizedPillar || !allowedWeaknessMap.has(normalizedPillar)) {
          throw new Error(`Suggestion for unsupported pillar: ${suggestion.pillar}`);
        }
        if (seen.has(normalizedPillar)) {
          throw new Error(`Duplicate suggestion for pillar: ${normalizedPillar}`);
        }

        const target = allowedWeaknessMap.get(normalizedPillar)!;
        const combinedSuggestionText = `${suggestion.rationale} ${suggestion.suggestion}`;
        const referencesPrimaryRationale = referencesRationale(
          target.rationale,
          combinedSuggestionText,
        );
        const referencesWeaknessList = target.weaknesses.some((weakness) =>
          referencesRationale(weakness, combinedSuggestionText),
        );

        if (!referencesPrimaryRationale && !referencesWeaknessList) {
          throw new Error(`Suggestion for ${normalizedPillar} failed rationale reference check`);
        }

        seen.add(normalizedPillar);
        const enforcedImpact = Math.max(1, 85 - Math.round(target.score));

        return {
          pillar: normalizedPillar,
          issue: suggestion.issue.trim(),
          rationale: suggestion.rationale.trim(),
          suggestion: suggestion.suggestion.trim(),
          estimatedImpact: enforcedImpact,
          score: target.score,
        };
      });
    };

    let cleanedSuggestions: Array<{
      pillar: PillarLabel;
      issue: string;
      rationale: string;
      suggestion: string;
      estimatedImpact: number;
      score: number;
    }> | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      try {
        const raw = await generateRawSuggestions();
        cleanedSuggestions = validateAndClean(raw);
        lastError = null;
        break;
      } catch (error) {
        lastError = error as Error;
        console.warn("Suggestion validation failed on attempt", attempt + 1, error);
      }
    }

    if (!cleanedSuggestions) {
      throw lastError || new Error("Failed to generate valid suggestions");
    }

    return NextResponse.json({ suggestions: cleanedSuggestions });
  } catch (error) {
    console.error("Ideate suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 },
    );
  }
}
