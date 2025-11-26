import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const PILLAR_NAMES = [
  "Audience Fit",
  "Competition",
  "Market Demand",
  "Feasibility",
  "Pricing Potential",
];

const PILLAR_KEY_TO_LABEL: Record<string, string> = {
  audienceFit: "Audience Fit",
  competition: "Competition",
  marketDemand: "Market Demand",
  feasibility: "Feasibility",
  pricingPotential: "Pricing Potential",
};

export async function POST(req: Request) {
  try {
    const {
      idea,
      mode,
      targetMarket,
      targetCountry,
      budget,
      timescales,
      initialFeedback,
      forcedSuggestion,
      forcedPillar,
      issue,
      rationale,
      aiProductOverview,
    } = await req.json();

    if (!idea || typeof idea !== "string") {
      return NextResponse.json(
        { error: "Idea text is required" },
        { status: 400 },
      );
    }

    const contextParts: string[] = [];
    if (mode) {
      contextParts.push(`Mode: ${mode}`);
    }
    if (targetMarket) {
      contextParts.push(`Target market: ${targetMarket}`);
    }
    if (targetCountry) {
      contextParts.push(`Target country: ${targetCountry}`);
    }
    if (budget) {
      contextParts.push(`Budget: ${budget}`);
    }
    if (timescales) {
      contextParts.push(`Timeline: ${timescales}`);
    }

    const lowPillars: { name: string; score: number; rationale?: string }[] = [];
    if (initialFeedback?.scores) {
      for (const [key, value] of Object.entries(initialFeedback.scores)) {
        const label = PILLAR_KEY_TO_LABEL[key] || key;
        const numericScore = (value as any)?.score;
        if (typeof numericScore === "number" && numericScore < 75) {
          lowPillars.push({
            name: label,
            score: numericScore,
            rationale: typeof (value as any)?.rationale === "string" ? (value as any).rationale : undefined,
          });
        }
      }
      if (lowPillars.length > 0) {
        contextParts.push(
          `Pillars needing improvement:\n${lowPillars
            .map(
              (pillar) =>
                `- ${pillar.name}: score ${pillar.score}% ${
                  pillar.rationale ? `(${pillar.rationale})` : ""
                }`,
            )
            .join("\n")}`,
        );
      }
    }

    const normalizedForcedPillar = forcedPillar
      ? PILLAR_NAMES.find((name) => name.toLowerCase() === String(forcedPillar).toLowerCase()) ||
        PILLAR_KEY_TO_LABEL[forcedPillar as keyof typeof PILLAR_KEY_TO_LABEL] ||
        null
      : null;
    const sanitizedOverview =
      typeof aiProductOverview === "string" ? aiProductOverview.trim() : "";
    const forcedIssue = typeof issue === "string" ? issue.trim() : "";
    const forcedRationale = typeof rationale === "string" ? rationale.trim() : "";
    const sanitizedForcedSuggestion =
      typeof forcedSuggestion === "string" ? forcedSuggestion.trim() : "";

    if (normalizedForcedPillar && forcedIssue && forcedRationale) {
      if (!sanitizedOverview) {
        return NextResponse.json(
          { error: "AI Product Overview text is required to apply suggestions" },
          { status: 400 },
        );
      }

      if (!sanitizedForcedSuggestion) {
        return NextResponse.json(
          { error: "Suggestion text is required to update the AI Product Overview" },
          { status: 400 },
        );
      }

      const overviewSystemPrompt = `You are editing an AI Product Overview for a startup brief.
Respond ONLY with valid JSON:
{
  "aiProductOverview": "<updated overview text>"
}
Rules:
- Modify ONLY the AI Product Overview content.
- Incorporate the provided suggestion and resolve the cited rationale directly.
- Keep structure, tone, and sections intact unless a change is required to address the rationale.
- Do not alter unrelated sections or introduce new topics.
- No commentary or additional fields outside the JSON schema.`;

      const overviewUserPrompt = `Current AI Product Overview:
${sanitizedOverview}

Validation context:
- Pillar: ${normalizedForcedPillar}
- Rationale: "${forcedRationale}"

Suggestion to apply:
${sanitizedForcedSuggestion}

Additional context:
${contextParts.join("\n") || "No extra context."}

Rewrite the AI Product Overview so it explicitly resolves the rationale while preserving everything else.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: overviewSystemPrompt },
          { role: "user", content: overviewUserPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        return NextResponse.json(
          { error: "Empty response while updating AI Product Overview" },
          { status: 500 },
        );
      }

      let updatedOverview = sanitizedOverview;
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed.aiProductOverview === "string" && parsed.aiProductOverview.trim()) {
          updatedOverview = parsed.aiProductOverview.trim();
        }
      } catch {
        updatedOverview = content;
      }

      return NextResponse.json({ aiProductOverview: updatedOverview });
    }

const systemPrompt = `You are a startup mentor who helps founders iteratively refine their ideas.
Respond ONLY with valid JSON exactly in this structure:
{
  "idea": "<improved idea text with paragraphs>",
  "suggestions": [
    { 
      "text": "<specific adjustment>", 
      "impact": <number between 1 and 15>,
      "pillars": ["Audience Fit", "Competition", "Market Demand", "Feasibility", "Pricing Potential"]
    }
  ]
}
- "idea" must contain the refined narrative.
- "suggestions" must be 2-4 short, actionable improvements with:
  * an estimated impact percentage (1-15) representing potential validation score lift
  * an array of impacted validation pillars chosen ONLY from the list provided (omit duplicates, omit unknown names)
Do not output any additional text outside this JSON.`;

    const instructionSegments: string[] = [];
    if (normalizedForcedPillar && issue) {
      const rationaleNote = typeof rationale === "string" && rationale.trim().length > 0
        ? ` Use the validation rationale "${rationale.trim()}" as the exact weakness to fix.`
        : "";
      instructionSegments.push(
        `Focus on improving the ${normalizedForcedPillar} pillar by resolving this issue: "${issue}".${rationaleNote} Modify only the sections of the idea that are necessary to address this rationale and keep all other content intact.`,
      );
    } else if (forcedSuggestion) {
      instructionSegments.push(
        `Rewrite the idea to incorporate the following improvement without changing the overall intent:\n"${forcedSuggestion}"`,
      );
    }

    const userPrompt = `Existing idea:
${idea}

Additional context:
${contextParts.join("\n") || "No additional details."}

${instructionSegments.join("\n")} 

${lowPillars.length
  ? `Provide exactly one suggestion for each pillar listed above. Set the "pillars" array to that pillar's name only, and base the improvement on the issue noted.`
  : `If no specific pillars are listed, provide up to two general improvements and set "pillars" to ["Overall"].`}

Rewrite the idea to improve clarity, differentiation, and business viability.
Preserve the original intent, but address weaknesses and make the positioning stronger.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    let refinedIdea = idea;
    let suggestions: { text: string; impact: number; pillars: string[] }[] = [];

    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed.idea === "string") {
          refinedIdea = parsed.idea.trim();
        }
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions
            .map((item: any) => {
              const rawPillars: string[] = Array.isArray(item?.pillars)
                ? item.pillars
                : [];
              const normalizedPillars = rawPillars
                .map((pillar) => {
                  if (typeof pillar !== "string") return null;
                  const trimmed = pillar.trim();
                  const match = PILLAR_NAMES.find(
                    (name) => name.toLowerCase() === trimmed.toLowerCase(),
                  );
                  return match || null;
                })
                .filter((pillar): pillar is string => Boolean(pillar));
              return {
                text: typeof item?.text === "string" ? item.text.trim() : "",
                impact:
                  typeof item?.impact === "number"
                    ? Math.max(1, Math.min(15, Math.round(item.impact)))
                    : 5,
                pillars:
                  normalizedPillars.length > 0 ? normalizedPillars : ["Overall"],
              };
            })
            .filter((item: { text: string }) => item.text.length > 0);
        } else if (Array.isArray(parsed.highlights)) {
          suggestions = parsed.highlights
            .map((item: any) => ({
              text: typeof item === "string" ? item.trim() : "",
              impact: 5,
              pillars: ["Overall"],
            }))
            .filter((item: { text: string }) => item.text.length > 0);
        }
      } catch {
        refinedIdea = content;
      }
    }

    return NextResponse.json({ idea: refinedIdea, suggestions });
  } catch (error) {
    console.error("Ideate refine API error:", error);
    return NextResponse.json(
      { error: "Failed to refine idea" },
      { status: 500 },
    );
  }
}
