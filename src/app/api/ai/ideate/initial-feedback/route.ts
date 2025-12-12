import { NextResponse } from "next/server";
import { runIdeateInitialFeedback } from "@/server/ideate/initialFeedback";

export async function POST(req: Request) {
  try {
    const {
      mode,
      userInput,
      selectedIdea,
      targetMarket,
      targetCountry,
      budget,
      timescales,
      aiReview,
    } = await req.json();

    if (!aiReview) {
      return NextResponse.json({ error: "AI Review is required" }, { status: 400 });
    }

    const feedback = await runIdeateInitialFeedback(
      {
        mode,
        userInput,
        selectedIdea,
        targetMarket,
        targetCountry,
        budget,
        timescales,
      },
      aiReview,
    );

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Initial feedback error:", error);
    return NextResponse.json({ error: "Failed to generate initial feedback" }, { status: 500 });
  }
}
