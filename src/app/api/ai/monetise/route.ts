import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();
    
    // Parse idea to extract monetise context variables
    let ideaData;
    try {
      ideaData = typeof idea === 'string' ? JSON.parse(idea) : idea;
    } catch {
      ideaData = { idea };
    }
    
    const revenueGoal = ideaData.revenueGoal || '$0→$1K';
    const timeHorizon = ideaData.timeHorizon || '6 months';
    
    // Get AI configuration from database
    const config = await getAIConfig('monetise');
    const fallbackConfig = defaultAIConfigs.monetise;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    const systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || "";
    const userPromptTemplate = config?.user_prompt_template || fallbackConfig?.user_prompt_template || "";
    
    // Substitute variables in user prompt template
    const userPrompt = substitutePromptTemplate(userPromptTemplate, { 
      idea: ideaData.selectedIdea || ideaData.idea || idea,
      revenueGoal,
      timeHorizon
    });
    
    const systemPromptWithVars = substitutePromptTemplate(systemPrompt, { 
      revenueGoal,
      timeHorizon
    });
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { 
          role: "system", 
          content: systemPromptWithVars
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
    return NextResponse.json({ error: 'Failed to generate monetization strategy' }, { status: 500 });
  }
}
