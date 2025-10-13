import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const { idea } = await req.json();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: "You are an expert startup validation coach. Analyze market opportunities, competition, and provide actionable validation strategies." 
      },
      { 
        role: "user", 
        content: `Analyze and validate this startup idea: ${idea}. Provide market research insights, competitive analysis, target audience validation, and recommended validation experiments.` 
      },
    ],
  });
  return NextResponse.json({ result: completion.choices[0]?.message?.content });
}
