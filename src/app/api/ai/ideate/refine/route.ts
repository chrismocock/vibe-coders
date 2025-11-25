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
        if (typeof numericScore === "number" && numericScore < 80) {
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
      instructionSegments.push(
        `Focus on improving the ${normalizedForcedPillar} pillar by resolving this issue: "${issue}". Apply only the changes necessary to fix this weakness and keep the rest of the narrative intact.`,
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
