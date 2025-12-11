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
  estimatedImpact: z.number().min(1).max(20),
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
  if (!normalized.length) return false;
  
  // Check if it ends with sentence-ending punctuation
  const endsWithPunctuation = /[.!?]$/.test(normalized);
  if (!endsWithPunctuation) {
    return false;
  }

  // Count sentence-ending punctuation, but ignore:
  // 1. Periods/quotes inside double quotes
  // 2. Periods in abbreviations (like "Inc.", "vs.", etc.) - these are usually followed by a space and capital letter
  // 3. Periods in decimal numbers
  // 4. Colons (which are used in these suggestions like "AI Product Overview:")
  
  let periodCount = 0;
  let questionCount = 0;
  let exclamationCount = 0;
  let inDoubleQuotes = false;
  let inSingleQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const prevChar = i > 0 ? normalized[i - 1] : '';
    const nextChar = i < normalized.length - 1 ? normalized[i + 1] : '';
    
    if (char === '"') {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }
    if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }
    
    // Skip punctuation inside quotes
    if (inDoubleQuotes || inSingleQuotes) {
      continue;
    }
    
    // Skip periods that are likely abbreviations (like "Inc.", "vs.", "e.g.")
    if (char === ".") {
      // Extract the word before the period to check if it's a known abbreviation
      let wordStart = i - 1;
      while (wordStart >= 0 && /[a-zA-Z]/.test(normalized[wordStart])) {
        wordStart--;
      }
      wordStart++; // Move back to first letter of word
      const wordBeforePeriod = normalized.substring(wordStart, i).toLowerCase();
      
      // List of common abbreviations
      const commonAbbrevs = ['inc', 'corp', 'ltd', 'co', 'llc', 'vs', 'mr', 'mrs', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'blvd', 'rd', 'etc', 'e.g', 'i.e'];
      const isKnownAbbrev = commonAbbrevs.includes(wordBeforePeriod);
      
      // Also check if it follows abbreviation pattern: letter + period + (space|end|capital|comma|semicolon|colon)
      const hasLetterBefore = /[a-zA-Z]/.test(prevChar);
      const hasAbbrevPatternAfter = nextChar === ' ' || nextChar === '' || /[A-Z]/.test(nextChar) || nextChar === ',' || nextChar === ';' || nextChar === ':';
      const isAbbreviationPattern = hasLetterBefore && hasAbbrevPatternAfter;
      
      // Skip if it's a known abbreviation or matches abbreviation pattern
      if (isKnownAbbrev || isAbbreviationPattern) {
        continue;
      }
      
      // Skip periods in decimal numbers
      if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
        continue;
      }
      
      // This is a sentence-ending period
      periodCount += 1;
    } else if (char === "?") {
      questionCount += 1;
    } else if (char === "!") {
      exclamationCount += 1;
    }
  }

  // Must have exactly one sentence-ending punctuation mark
  const totalEndPunctuation = periodCount + questionCount + exclamationCount;
  return totalEndPunctuation === 1;
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

// Calculate similarity between two strings using Levenshtein distance
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  
  // Simple character-based similarity (percentage of matching characters in order)
  let matches = 0;
  const shorterLower = shorter.toLowerCase();
  const longerLower = longer.toLowerCase();
  for (let i = 0; i < shorterLower.length; i++) {
    if (longerLower.includes(shorterLower[i])) {
      matches++;
    }
  }
  return matches / longer.length;
};

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
      pillarWeaknesses: formattedWeaknesses.map(w => ({
        pillar: w.pillar,
        score: w.score,
        rationale: w.rationale,
        weaknesses: w.weaknesses,
        // Add guidance for what kind of improvement would help
        improvementGuidance: `The ${w.pillar} pillar scores ${w.score}% because: ${w.rationale}. To improve this score, suggest specific positive content or changes that address this weakness, not just restating the problem.`
      })),
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
      "suggestion": "<specific edit>",
      "estimatedImpact": <number between 1 and 20>
    }
  ]
}

CRITICAL: Suggestions must provide CONSTRUCTIVE IMPROVEMENTS, not just restate the weakness.

Rules:
- Generate exactly ONE suggestion per weak pillar (score < 75) and keep the array length identical to the provided pillarWeaknesses.
- Mirror the pillar names exactly as provided.
- The "rationale" field MUST repeat the provided rationale text verbatim and the "issue" field should be a concise label derived from the same weakness.
- Each suggestion must be a single sentence ending with a period, begin with Add/Insert/Modify/Clarify/Rewrite/Extend, explicitly mention "AI Product Overview", and describe HOW to improve the pillar.
- **DO NOT simply add the weakness statement - instead, describe what positive content to add or how to strengthen the relevant section.**
- Suggestions must describe tangible edits to the AI Product Overview that will IMPROVE the pillar score by addressing the weakness.
- Forbidden phrases: ${FORBIDDEN_PHRASES.join(", ")}.
- **CRITICAL: "estimatedImpact" must be a realistic, conservative estimate (1-20 points) of how much the validation score could improve if this suggestion is applied. Consider the current score, the severity of the weakness, and the potential impact of the suggested change. Be conservative - it's better to underestimate than overpromise.**
- Output strict JSON only with no commentary or prose.

Good Suggestion Examples:
- "Add to the Competition section of the AI Product Overview: specific examples of unique features that differentiate this product from competitors mentioned in the rationale."
- "Modify the Feasibility section in the AI Product Overview to include a phased development approach that addresses the resource constraints mentioned."
- "Extend the Pricing Potential section of the AI Product Overview with a tiered pricing strategy that addresses price sensitivity concerns."

Bad Suggestion Examples (DO NOT USE):
- "Add to AI Product Overview: \"The market is competitive\"." (just restates weakness)
- "Add to AI Product Overview: \"Building may face resource constraints\"." (just restates weakness)`;

    const requiredInstruction = `Generate exactly ONE suggestion for EACH weak pillar.

Your suggestion must:
- Be a single sentence ending with a period
- Begin with Add/Insert/Modify/Clarify/Rewrite/Extend
- Include the literal text "AI Product Overview"
- Describe WHAT positive content to add or HOW to strengthen the section to address the weakness
- NOT simply restate the weakness - provide a constructive improvement

IMPORTANT: 
- The "rationale" field in your JSON must contain the FULL rationale text verbatim.
- The "suggestion" field must describe an ACTIONABLE improvement, not just the problem.
- Focus on what positive content or changes will strengthen the pillar and address the weakness.

You MUST output strict JSON that matches the given schema.
Do NOT include explanations or prose.`;

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
      let parsedJson: any;
      // Try to extract JSON from markdown code blocks if present (same approach as build scope suggest)
      let jsonString = raw.trim();
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }
      try {
        parsedJson = JSON.parse(jsonString);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      let parsed;
      try {
        parsed = ResponseSchema.parse(parsedJson);
      } catch (zodError) {
        throw zodError;
      }
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
        let trimmedSuggestion = suggestion.suggestion.trim();

        if (!trimmedIssue || !trimmedRationale || !trimmedSuggestion) {
          throw new Error("Suggestion payload missing required text");
        }

        if (containsForbiddenLanguage(trimmedSuggestion)) {
          logValidationIssue({ type: "forbidden_language", suggestion: trimmedSuggestion });
          throw new Error("Suggestion contains forbidden generic language");
        }

        // Compare rationales - allow for minor differences (whitespace, punctuation, minor paraphrasing)
        // Normalize whitespace (multiple spaces to single space, trim) but keep case-sensitive
        const normalizeForComparison = (text: string) => text.replace(/\s+/g, " ").trim();
        const normalizedReceived = normalizeForComparison(trimmedRationale);
        const normalizedExpected = normalizeForComparison(normalizedTargetRationale);
        
        // First try exact match (after normalization)
        if (normalizedReceived === normalizedExpected) {
          // Exact match - proceed
        } else {
          // Check for high similarity (90%+ word match) to allow for minor AI paraphrasing
          const expectedWords = normalizedExpected.toLowerCase().split(/\s+/).filter(w => w.length > 0);
          const receivedWords = normalizedReceived.toLowerCase().split(/\s+/).filter(w => w.length > 0);
          
          // Calculate word overlap ratio
          const expectedWordSet = new Set(expectedWords);
          const receivedWordSet = new Set(receivedWords);
          const commonWords = expectedWords.filter(w => receivedWordSet.has(w));
          const wordMatchRatio = commonWords.length / Math.max(expectedWords.length, receivedWords.length);
          
          // Also check character-level similarity for short rationales
          const charSimilarity = calculateSimilarity(normalizedExpected, normalizedReceived);
          
          // Allow if word match is 90%+ OR character similarity is 85%+ (for short rationales)
          const isSimilar = wordMatchRatio >= 0.90 || (normalizedExpected.length < 100 && charSimilarity >= 0.85);
          
          if (!isSimilar) {
            logValidationIssue({
              type: "rationale_mismatch",
              expected: normalizedTargetRationale,
              received: trimmedRationale,
              pillar: normalizedPillar,
            });
            throw new Error(`Suggestion rationale must substantially match validation rationale. Pillar: ${normalizedPillar}. Word match: ${(wordMatchRatio * 100).toFixed(1)}%, Char similarity: ${(charSimilarity * 100).toFixed(1)}%. Expected: "${normalizedTargetRationale.substring(0, 150)}...". Received: "${trimmedRationale.substring(0, 150)}..."`);
          }
        }

        // Check action verb - be more lenient: allow if it starts with any action-like word
        const firstWord = trimmedSuggestion.trim().split(/\s+/)[0]?.toLowerCase();
        const actionVerbsLower = STRICT_ACTION_VERBS.map(v => v.toLowerCase());
        const hasActionVerb = actionVerbsLower.includes(firstWord);
        
        // Also check for common action verb variations
        const actionVariations = ['add', 'insert', 'modify', 'clarify', 'rewrite', 'extend', 'update', 'improve', 'enhance', 'expand', 'refine'];
        const hasActionVariation = actionVariations.some(v => firstWord === v || firstWord?.startsWith(v));
        
        if (!hasActionVerb && !hasActionVariation) {
          // Try to auto-fix: if suggestion is otherwise valid, prepend "Add" and continue
          const autoFixedSuggestion = `Add ${trimmedSuggestion.charAt(0).toLowerCase() + trimmedSuggestion.slice(1)}`;
          // Use the auto-fixed version if it would pass other checks
          if (autoFixedSuggestion.toLowerCase().includes('ai product overview') && isOneSentence(autoFixedSuggestion)) {
            trimmedSuggestion = autoFixedSuggestion;
          } else {
            logValidationIssue({ type: "action_verb", suggestion: trimmedSuggestion });
            throw new Error(`Suggestion should start with an action verb (${STRICT_ACTION_VERBS.join(", ")}). Got: "${firstWord}". Full suggestion: "${trimmedSuggestion.substring(0, 100)}..."`);
          }
        }

        // Check sentence count - be more lenient: allow if it's mostly one sentence (maybe with minor punctuation issues)
        const periodCount = (trimmedSuggestion.match(/\./g) || []).length;
        const questionCount = (trimmedSuggestion.match(/\?/g) || []).length;
        const exclamationCount = (trimmedSuggestion.match(/!/g) || []).length;
        const totalEndPunctuation = periodCount + questionCount + exclamationCount;
        
        // Allow if it's one sentence OR if extra periods are in abbreviations/quotes
        const isOneSentenceStrict = isOneSentence(trimmedSuggestion);
        const isMostlyOneSentence = totalEndPunctuation <= 2 && periodCount <= 2; // Allow up to 2 periods (might be abbreviations)
        
        if (!isOneSentenceStrict && !isMostlyOneSentence) {
          // Try to auto-fix: take only the first sentence
          const firstSentenceMatch = trimmedSuggestion.match(/^[^.!?]+[.!?]/);
          if (firstSentenceMatch) {
            const autoFixedSuggestion = firstSentenceMatch[0].trim();
            if (autoFixedSuggestion.toLowerCase().includes('ai product overview') && startsWithActionVerb(autoFixedSuggestion)) {
              trimmedSuggestion = autoFixedSuggestion;
            } else {
              logValidationIssue({ type: "sentence_count", suggestion: trimmedSuggestion });
              throw new Error(`Suggestion should be one sentence. Found ${periodCount} periods, ${questionCount} questions, ${exclamationCount} exclamations. Full suggestion: "${trimmedSuggestion}"`);
            }
          } else {
            logValidationIssue({ type: "sentence_count", suggestion: trimmedSuggestion });
            throw new Error(`Suggestion should be one sentence. Found ${periodCount} periods, ${questionCount} questions, ${exclamationCount} exclamations. Full suggestion: "${trimmedSuggestion}"`);
          }
        }

        // Word limit check removed - no longer blocking validation
        // if (!withinWordLimit(trimmedSuggestion, WORD_LIMIT)) {
        //   logValidationIssue({ type: "word_limit", suggestion: trimmedSuggestion });
        //   throw new Error("Suggestion exceeds the 25-word limit");
        // }

        // Check for AI Product Overview mention - be more lenient: allow variations
        const lowerSuggestion = trimmedSuggestion.toLowerCase();
        const hasAiProductOverview = lowerSuggestion.includes('ai product overview') || 
                                     lowerSuggestion.includes('product overview') ||
                                     lowerSuggestion.includes('overview section');
        
        if (!hasAiProductOverview) {
          // Try to auto-fix: add the mention if it's missing
          if (trimmedSuggestion.includes('section') || trimmedSuggestion.includes('Overview')) {
            // Already mentions overview/section, just needs "AI Product"
            const autoFixedSuggestion = trimmedSuggestion.replace(/(overview|section)/i, 'AI Product Overview');
            if (isOneSentence(autoFixedSuggestion) && startsWithActionVerb(autoFixedSuggestion)) {
              trimmedSuggestion = autoFixedSuggestion;
            } else {
              logValidationIssue({ type: "missing_ai_product_overview", suggestion: trimmedSuggestion });
              throw new Error(`Suggestion should reference the "AI Product Overview". Full suggestion: "${trimmedSuggestion}"`);
            }
          } else {
            logValidationIssue({ type: "missing_ai_product_overview", suggestion: trimmedSuggestion });
            throw new Error(`Suggestion should reference the "AI Product Overview". Full suggestion: "${trimmedSuggestion}"`);
          }
        }

        // Relaxed validation: suggestion should address the weakness but doesn't need to include exact rationale text
        // This allows suggestions to describe improvements rather than just restating the problem
        const addressesWeakness = 
          includesExactRationale(normalizedTargetRationale, trimmedSuggestion) ||
          trimmedSuggestion.toLowerCase().includes(normalizedTargetRationale.toLowerCase().substring(0, 20)) ||
          (normalizedTargetRationale.length > 50 && trimmedSuggestion.toLowerCase().includes(normalizedTargetRationale.toLowerCase().substring(0, 30)));
        
        if (!addressesWeakness && normalizedTargetRationale.length < 100) {
          // Only enforce for short rationales - long ones may be addressed conceptually
          logValidationIssue({
            type: "weakness_not_addressed",
            suggestion: trimmedSuggestion,
            rationale: normalizedTargetRationale,
          });
          // Warning only, don't throw - allow suggestions that describe improvements
        }

        const derivedIssue =
          (Array.isArray(target.weaknesses) && target.weaknesses[0]?.trim()) ||
          normalizedTargetRationale ||
          trimmedIssue;

        seen.add(normalizedPillar);
        
        // Use AI-provided estimate if valid, otherwise use conservative fallback
        let estimatedImpact: number;
        if (
          typeof suggestion.estimatedImpact === "number" &&
          !Number.isNaN(suggestion.estimatedImpact) &&
          suggestion.estimatedImpact >= 1 &&
          suggestion.estimatedImpact <= 20
        ) {
          estimatedImpact = Math.round(suggestion.estimatedImpact);
        } else {
          // Conservative fallback: 40% of gap to 85, capped at 15 points, minimum 3 points
          const gapTo85 = 85 - Math.round(target.score);
          estimatedImpact = Math.min(15, Math.max(3, Math.round(gapTo85 * 0.4)));
        }

        return {
          pillar: normalizedPillar,
          issue: derivedIssue,
          rationale: trimmedRationale,
          suggestion: trimmedSuggestion,
          estimatedImpact: estimatedImpact,
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
    let lastRawResponse: string | null = null;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      try {
        const raw = await generateRawSuggestions();
        lastRawResponse = raw;
        cleanedSuggestions = validateAndClean(raw);
        lastError = null;
        break;
      } catch (error) {
        lastError = error as Error;
        console.warn("Suggestion validation failed on attempt", attempt + 1, error);
        
        // If this is the last attempt, try to extract partial results
        if (attempt === MAX_GENERATION_ATTEMPTS - 1 && lastRawResponse) {
          try {
            // Try to parse and return whatever we can validate
            let jsonString = lastRawResponse.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonString = jsonMatch[1].trim();
            }
            const parsed = JSON.parse(jsonString);
            if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
              // Try to validate each suggestion individually and return the ones that pass
              const partialSuggestions: any[] = [];
              for (const suggestion of parsed.suggestions) {
                try {
                  // Try to validate this single suggestion
                  const normalizedPillar = normalizePillarLabel(suggestion.pillar);
                  if (normalizedPillar && formattedWeaknesses.some(w => w.pillar === normalizedPillar)) {
                    // Basic validation passed, add it
                    const target = formattedWeaknesses.find(w => w.pillar === normalizedPillar)!;
                    partialSuggestions.push({
                      pillar: normalizedPillar,
                      issue: suggestion.issue || target.rationale.substring(0, 50),
                      rationale: suggestion.rationale || target.rationale,
                      suggestion: suggestion.suggestion || "Please review and improve this section.",
                      estimatedImpact: typeof suggestion.estimatedImpact === 'number' ? suggestion.estimatedImpact : 5,
                      score: target.score,
                    });
                  }
                } catch (e) {
                  // Skip this suggestion
                }
              }
              if (partialSuggestions.length > 0) {
                cleanedSuggestions = partialSuggestions;
                break;
              }
            }
          } catch (fallbackError) {
            // Fallback extraction failed, continue to throw original error
          }
        }
      }
    }

    if (!cleanedSuggestions || cleanedSuggestions.length === 0) {
      throw lastError || new Error(`Failed to generate valid suggestions after ${MAX_GENERATION_ATTEMPTS} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    return NextResponse.json({ suggestions: cleanedSuggestions });
  } catch (error) {
    console.error("Ideate suggestions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 500 },
    );
  }
}
