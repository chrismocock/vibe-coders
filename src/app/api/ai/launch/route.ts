import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();
    
    // Parse idea to extract launch context variables
    let ideaData;
    try {
      ideaData = typeof idea === 'string' ? JSON.parse(idea) : idea;
    } catch {
      ideaData = { idea };
    }
    
    const launchStrategy = ideaData.launchStrategy || 'Pre-launch Hype';
    const marketingBudget = ideaData.marketingBudget || '$0 (Organic only)';
    const launchTimeline = ideaData.launchTimeline || '2-4 weeks';
    
    // Get AI configuration from database
    const config = await getAIConfig('launch');
    const fallbackConfig = defaultAIConfigs.launch;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    const systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || "";
    const userPromptTemplate = config?.user_prompt_template || fallbackConfig?.user_prompt_template || "";
    
    // Substitute variables in prompts
    const userPrompt = substitutePromptTemplate(userPromptTemplate, { 
      idea: ideaData.selectedIdea || ideaData.idea || idea,
      launchStrategy,
      marketingBudget,
      launchTimeline
    });
    
    const systemPromptWithVars = substitutePromptTemplate(systemPrompt, { 
      launchStrategy,
      marketingBudget,
      launchTimeline
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
    return NextResponse.json({ error: 'Failed to generate launch strategy' }, { status: 500 });
  }
}
