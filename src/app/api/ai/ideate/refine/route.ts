import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

    if (initialFeedback?.scores) {
      const weakAreas = Object.entries(initialFeedback.scores)
        .filter(([, value]) => {
          const numericScore = (value as any)?.score;
          return typeof numericScore === "number" && numericScore < 70;
        })
        .map(([key]) =>
          key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim(),
        );

      if (weakAreas.length > 0) {
        contextParts.push(
          `Focus on improving: ${weakAreas.join(", ")} based on prior validation scores.`,
        );
      }
    }

    const systemPrompt = `You are a startup mentor who helps founders iteratively refine their ideas.
Respond ONLY with valid JSON that contains two fields:
{
  "idea": "<improved idea text with paragraphs>",
  "highlights": ["point 1", "point 2", ...]
}
The "idea" field should be a refined, polished version of the input idea.
The "highlights" field should contain 2-4 short bullet points describing what you improved.`;

    const userPrompt = `Existing idea:
${idea}

Additional context:
${contextParts.join("\n") || "No additional details."}

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
    let highlights: string[] = [];

    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed.idea === "string") {
          refinedIdea = parsed.idea.trim();
        }
        if (Array.isArray(parsed.highlights)) {
          highlights = parsed.highlights
            .map((item: any) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean);
        }
      } catch {
        refinedIdea = content;
      }
    }

    return NextResponse.json({ idea: refinedIdea, highlights });
  } catch (error) {
    console.error("Ideate refine API error:", error);
    return NextResponse.json(
      { error: "Failed to refine idea" },
      { status: 500 },
    );
  }
}
