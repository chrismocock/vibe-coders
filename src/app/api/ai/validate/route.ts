import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();
    
    // Get AI configuration from database
    const config = await getAIConfig('validate');
    const fallbackConfig = defaultAIConfigs.validate;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    const systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || "";
    const userPromptTemplate = config?.user_prompt_template || fallbackConfig?.user_prompt_template || "";
    
    // Substitute variables in user prompt template
    const userPrompt = substitutePromptTemplate(userPromptTemplate, { idea });
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        },
      ],
    });
    
    return NextResponse.json({ result: completion.choices[0]?.message?.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to generate validation analysis' }, { status: 500 });
  }
}
