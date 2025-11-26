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
  suggestion: z.string().min(12),
  estimatedImpact: z.number().min(1).max(85),
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

const STRICT_ACTION_VERBS = ["Add", "Insert", "Modify", "Clarify", "Rewrite", "Extend"];

const FORBIDDEN_PHRASES = [
  "competitive edge",
  "positioning",
  "value proposition",
  "refine narrative",
  "unique value",
  "holistic",
  "streamline",
  "optimize",
  "enhance clarity",
  "drive engagement",
  "strengthen proposition",
  "robust",
  "overall",
  "enhance differentiation",
  "improve narrative",
  "refine messaging",
  "highlight features",
  "position yourself",
  "generic marketing advice",
  "improve planning",
  "user insights",
  "add unique features",
];

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

const countWords = (text: string) => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const isOneSentence = (text: string) => {
  const normalized = text.trim();
  if (!normalized.endsWith(".")) {
    return false;
  }
  const periodMatches = normalized.match(/\./g) || [];
  const questionMatches = normalized.match(/\?/g) || [];
  const exclamationMatches = normalized.match(/!/g) || [];
  return periodMatches.length === 1 && questionMatches.length === 0 && exclamationMatches.length === 0;
};

const containsRationaleVerbatim = (rationale: string, suggestionText: string) => {
  if (!rationale) return false;
  return suggestionText.includes(rationale);
};

const referencesAIProductOverview = (text: string) => {
  return /ai product overview/i.test(text);
};

const startsWithActionVerb = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed.length) return false;
  const [firstWord] = trimmed.split(/\s+/);
  return STRICT_ACTION_VERBS.some((verb) => verb.toLowerCase() === firstWord.toLowerCase());
};

const containsForbiddenLanguage = (text: string) => {
  const lower = text.toLowerCase();
  return FORBIDDEN_PHRASES.some((phrase) => lower.includes(phrase));
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
    const { idea, pillarWeaknesses, pillarScores, aiProductOverview } = body || {};

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
        if (
          !normalizedPillar ||
          typeof weakness.score !== "number" ||
          Number.isNaN(weakness.score) ||
          weakness.score >= 75
        ) {
          return null;
        }
        const sanitizedRationale =
          typeof weakness.rationale === "string" ? weakness.rationale.trim() : "";
        if (!sanitizedRationale) {
          return null;
        }
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
    const sanitizedOverview = typeof aiProductOverview === "string" ? aiProductOverview.trim() : "";

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
- The "issue" and "rationale" fields MUST repeat the provided rationale text exactly.
- Each suggestion must be exactly one sentence (ending with a single period), begin with Add/Insert/Modify/Clarify/Rewrite/Extend, mention the phrase "AI Product Overview", stay at or below 25 words, and include the rationale verbatim.
- Suggestions must describe tangible edits to the AI Product Overview section only. No changes to idea text, marketing copy, or general strategy.
- Forbidden phrases: ${FORBIDDEN_PHRASES.join(", ")}.
- No extra text, markdown, or bullet points. Output JSON only.
- If you cannot comply, return the JSON structure with empty strings.
- Any schema violation, forbidden phrase, or missing rationale reference invalidates the response.`;

    const userPrompt = `Startup idea:\n${idea}\n\nCurrent AI Product Overview:\n${
      sanitizedOverview || "Not provided"
    }\n\nOverall pillar scores:\n${
      scoresSummary || "Not provided"
    }\n\nWeak pillars needing improvement:\n${weaknessSummary}\n\nInstructions:\n- FOR EACH weak pillar, generate ONE improvement suggestion.\n- Each suggestion must propose a concrete edit to the AI Product Overview (not the idea text) that resolves the rationale.\n- Start with Add, Insert, Modify, Clarify, Rewrite, or Extend; mention "AI Product Overview"; include the full rationale text verbatim; keep it one sentence under 25 words.\n- Forbidden phrases: ${FORBIDDEN_PHRASES.join(
      ", ",
    )}.\n- Output strict JSON only.`;

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
        const normalizedTargetRationale = (target.rationale || "").trim();
        const trimmedIssue = suggestion.issue.trim();
        const trimmedRationale = suggestion.rationale.trim();
        const trimmedSuggestion = suggestion.suggestion.trim();

        if (!trimmedIssue || !trimmedRationale || !trimmedSuggestion) {
          throw new Error("Suggestion payload missing required text");
        }

        if (
          containsForbiddenLanguage(trimmedSuggestion) ||
          containsForbiddenLanguage(trimmedIssue) ||
          containsForbiddenLanguage(trimmedRationale)
        ) {
          throw new Error("Suggestion contains forbidden generic language");
        }

        if (trimmedIssue !== normalizedTargetRationale) {
          throw new Error("Suggestion issue must match validation rationale exactly");
        }

        if (trimmedRationale !== normalizedTargetRationale) {
          throw new Error("Suggestion rationale must match validation rationale exactly");
        }

        if (!startsWithActionVerb(trimmedSuggestion)) {
          throw new Error("Suggestion must start with an approved action verb");
        }

        if (!isOneSentence(trimmedSuggestion)) {
          throw new Error("Suggestion must be exactly one sentence");
        }

        if (countWords(trimmedSuggestion) > 25) {
          throw new Error("Suggestion exceeds 25-word limit");
        }

        if (!referencesAIProductOverview(trimmedSuggestion)) {
          throw new Error('Suggestion must reference "AI Product Overview"');
        }

        if (!containsRationaleVerbatim(normalizedTargetRationale, trimmedSuggestion)) {
          throw new Error("Suggestion must include rationale verbatim");
        }

        const rationaleReferenced = referencesRationale(
          normalizedTargetRationale,
          trimmedSuggestion,
        );
        if (!rationaleReferenced) {
          throw new Error("Suggestion text does not explicitly reference rationale keywords");
        }

        seen.add(normalizedPillar);
        const enforcedImpact = Math.max(1, 85 - Math.round(target.score));

        return {
          pillar: normalizedPillar,
          issue: trimmedIssue,
          rationale: trimmedRationale,
          suggestion: trimmedSuggestion,
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
