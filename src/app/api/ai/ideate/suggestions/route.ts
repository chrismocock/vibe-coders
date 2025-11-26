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
  estimatedImpact: z.number().min(1).max(85).optional(),
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

const MAX_GENERATION_ATTEMPTS = 5;

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

const isOneSentence = (text: string) => {
  const normalized = text.trim();
  const punctuationTrimmed = normalized.replace(/["')\s]+$/g, "");
  const lastMeaningfulChar = punctuationTrimmed.slice(-1);
  if (lastMeaningfulChar !== ".") {
    return false;
  }

  let periodCount = 0;
  let questionCount = 0;
  let exclamationCount = 0;
  let inDoubleQuotes = false;

  for (const char of normalized) {
    if (char === '"') {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }
    if (inDoubleQuotes) {
      continue;
    }
    if (char === ".") {
      periodCount += 1;
    } else if (char === "?") {
      questionCount += 1;
    } else if (char === "!") {
      exclamationCount += 1;
    }
  }

  if (periodCount === 0) {
    periodCount = 1;
  }

  return periodCount === 1 && questionCount === 0 && exclamationCount === 0;
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

const logValidationIssue = (details: Record<string, unknown>) => {
  console.warn("Suggestion validation issue", details);
};

const withinWordLimit = (text: string, limit: number) => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length > 0 && words.length <= limit;
};

const mentionsAiProductOverview = (text: string) => /ai product overview/i.test(text);

const normalizeWhitespace = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();

const includesExactRationale = (rationale: string, suggestionText: string) => {
  const normalizedRationale = normalizeWhitespace(rationale);
  if (!normalizedRationale) return true;

  const haystack = normalizeWhitespace(suggestionText);
  if (haystack.includes(normalizedRationale)) {
    return true;
  }

  const rationaleWithoutEdgePunctuation = normalizeWhitespace(
    normalizedRationale.replace(/^["'`“”]+|["'`“”]+$/g, "").replace(/[.?!]+$/g, ""),
  );

  if (rationaleWithoutEdgePunctuation.length > 0 && haystack.includes(rationaleWithoutEdgePunctuation)) {
    return true;
  }

  // If rationale is very long, allow partial match (at least 50% of rationale words must be present)
  const rationaleWords = rationaleWithoutEdgePunctuation.split(/\s+/).filter(Boolean);
  if (rationaleWords.length > 15) {
    const matchingWords = rationaleWords.filter((word) => haystack.includes(word));
    const matchRatio = matchingWords.length / rationaleWords.length;
    return matchRatio >= 0.5;
  }

  return false;
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

const WORD_LIMIT = 25;

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

    const weaknessSummary = serializeWeaknesses(formattedWeaknesses);
    const sanitizedOverview = typeof aiProductOverview === "string" ? aiProductOverview.trim() : "";

    const suggestionContext = {
      idea,
      aiProductOverview: sanitizedOverview || "Not provided",
      pillarScores: pillarScores ?? null,
      pillarWeaknesses: formattedWeaknesses,
      weaknessSummary,
    };

    const systemPrompt = `You are a strict startup validation coach.
Respond ONLY with valid JSON that matches this schema:
{
  "suggestions": [
    {
      "pillar": "Audience Fit" | "Competition" | "Market Demand" | "Feasibility" | "Pricing Potential",
      "issue": "<short label>",
      "rationale": "<exact rationale text>",
      "suggestion": "<specific edit>"
    }
  ]
}
WORD LIMIT GUIDELINES (not strictly enforced):
- Aim to keep suggestions concise (around 25 words or fewer) for readability.
- If the rationale text is long, you may use the fallback pattern: "Add to AI Product Overview: \"<rationale>\"."
- The full rationale text must be provided in the "rationale" field.

Rules:
- Generate exactly ONE suggestion per weak pillar (score < 75) and keep the array length identical to the provided pillarWeaknesses.
- Mirror the pillar names exactly as provided.
- The "rationale" field MUST repeat the provided rationale text verbatim and the "issue" field should be a concise label derived from the same weakness.
- Each suggestion must be a single sentence ending with a period, begin with Add/Insert/Modify/Clarify/Rewrite/Extend, explicitly mention "AI Product Overview", and include the rationale text (or a truncated version if the full rationale is very long).
- Copy the rationale text exactly as provided (same casing and wording) and wrap it in double quotes inside the sentence.
- The "rationale" field in your JSON response must contain the FULL rationale text verbatim. The "suggestion" field can contain the full rationale or a truncated version if it's very long.
- If the rationale is long, you may use the fallback pattern "Add to AI Product Overview: \"<rationale>\"."
- Suggestions must describe tangible edits to the AI Product Overview only — never rewrite the user idea or add unrelated topics.
- Forbidden phrases: ${FORBIDDEN_PHRASES.join(", ")}.
- Output strict JSON only with no commentary or prose.

Word Count Examples:
- "Add to AI Product Overview: \"Idea lacks robust differentiators\"." = 8 words (CORRECT)
- "Add a line to the AI Product Overview explaining how you solve \"Idea lacks robust differentiators\" by highlighting one automation competitors lack." = 20 words (CORRECT)
- "Add to AI Product Overview: \"The proposal is feasible with a clear roadmap for MVP development and user engagement, although it will require careful resource management.\"." = 20 words (CORRECT - uses fallback for long rationale)

If your suggestion exceeds 25 words, you MUST use the fallback pattern: "Add to AI Product Overview: \"<rationale>\"."`;

    const requiredInstruction = `Generate exactly ONE suggestion for EACH weak pillar.

WORD LIMIT IS CRITICAL - MAX 25 WORDS:
- Count every word in your suggestion before responding. This includes "Add", "to", "AI", "Product", "Overview", and all words in the rationale.
- If the rationale is long (15+ words), you MUST use this exact fallback pattern: "Add to AI Product Overview: \"<rationale>\"."
- The fallback pattern is ALWAYS acceptable and preferred for long rationales.
- If you are unsure about word count, use the fallback pattern.

Your suggestion must be:
- A single sentence ending with a period
- Begin with Add/Insert/Modify/Clarify/Rewrite/Extend
- Include the literal text "AI Product Overview"
- Include the rationale (or truncated version if full rationale is very long) inside double quotes
- Propose a specific modification to the AI Product Overview section

IMPORTANT: The "rationale" field in your JSON must contain the FULL rationale text. The "suggestion" field can contain the full rationale or a truncated version if it's very long.

You MUST output strict JSON that matches the given schema.
Do NOT include explanations or prose.

When in doubt about word count, ALWAYS use: "Add to AI Product Overview: \"<rationale>\"."`;

    const userPrompt = `Context:\n${JSON.stringify(suggestionContext, null, 2)}\n\n${requiredInstruction}`;

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

        if (containsForbiddenLanguage(trimmedSuggestion)) {
          logValidationIssue({ type: "forbidden_language", suggestion: trimmedSuggestion });
          throw new Error("Suggestion contains forbidden generic language");
        }

        if (trimmedRationale !== normalizedTargetRationale) {
          logValidationIssue({
            type: "rationale_mismatch",
            expected: normalizedTargetRationale,
            received: trimmedRationale,
            pillar: normalizedPillar,
          });
          throw new Error("Suggestion rationale must match validation rationale exactly");
        }

        if (!startsWithActionVerb(trimmedSuggestion)) {
          logValidationIssue({ type: "action_verb", suggestion: trimmedSuggestion });
          throw new Error("Suggestion must start with an approved action verb");
        }

        if (!isOneSentence(trimmedSuggestion)) {
          logValidationIssue({ type: "sentence_count", suggestion: trimmedSuggestion });
          throw new Error("Suggestion must be exactly one sentence");
        }

        // Word limit check removed - no longer blocking validation
        // if (!withinWordLimit(trimmedSuggestion, WORD_LIMIT)) {
        //   logValidationIssue({ type: "word_limit", suggestion: trimmedSuggestion });
        //   throw new Error("Suggestion exceeds the 25-word limit");
        // }

        if (!mentionsAiProductOverview(trimmedSuggestion)) {
          logValidationIssue({ type: "missing_ai_product_overview", suggestion: trimmedSuggestion });
          throw new Error('Suggestion must reference the "AI Product Overview"');
        }

        if (!includesExactRationale(normalizedTargetRationale, trimmedSuggestion)) {
          logValidationIssue({
            type: "missing_rationale",
            suggestion: trimmedSuggestion,
            rationale: normalizedTargetRationale,
          });
          throw new Error("Suggestion must include the rationale text (or significant portion if rationale is very long)");
        }

        const derivedIssue =
          (Array.isArray(target.weaknesses) && target.weaknesses[0]?.trim()) ||
          normalizedTargetRationale ||
          trimmedIssue;

        seen.add(normalizedPillar);
        const enforcedImpact = Math.max(1, 85 - Math.round(target.score));

        return {
          pillar: normalizedPillar,
          issue: derivedIssue,
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
