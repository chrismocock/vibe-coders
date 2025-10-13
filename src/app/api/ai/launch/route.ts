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
        content: "You are an expert startup launch strategist. Create comprehensive launch plans including marketing strategies, PR campaigns, and go-to-market tactics." 
      },
      { 
        role: "user", 
        content: `Create a comprehensive launch strategy for this startup: ${idea}. Include marketing channels, PR strategy, launch timeline, target metrics, and post-launch optimization tactics.` 
      },
    ],
  });
  return NextResponse.json({ result: completion.choices[0]?.message?.content });
}
