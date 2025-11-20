import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();
    
    // Parse idea to extract build context variables
    let ideaData;
    try {
      ideaData = typeof idea === 'string' ? JSON.parse(idea) : idea;
    } catch {
      ideaData = { idea };
    }
    
    const buildMode = ideaData.buildMode || 'Vibe Coder (Build it yourself with AI)';
    const userBudget = ideaData.userBudget || 'Not specified';
    const userTimeline = ideaData.userTimeline || 'Not specified';
    
    // Get AI configuration from database
    const config = await getAIConfig('build');
    const fallbackConfig = defaultAIConfigs.build;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    const userPromptTemplate = config?.user_prompt_template || fallbackConfig?.user_prompt_template || "";
    
    // Select system prompt based on build mode
    let systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || "";
    
    if (buildMode === 'Vibe Coder (Build it yourself with AI)') {
      const systemPromptVibeCoder = config?.system_prompt_vibe_coder || fallbackConfig?.system_prompt_vibe_coder;
      if (systemPromptVibeCoder?.trim()) {
        systemPrompt = systemPromptVibeCoder;
      }
    } else if (buildMode === 'Send to Developers (Create PRD)') {
      const systemPromptSendToDevs = config?.system_prompt_send_to_devs || fallbackConfig?.system_prompt_send_to_devs;
      if (systemPromptSendToDevs?.trim()) {
        systemPrompt = systemPromptSendToDevs;
      }
    }
    
    // Substitute variables in prompts
    const userPrompt = substitutePromptTemplate(userPromptTemplate, { 
      idea: ideaData.selectedIdea || ideaData.idea || idea,
      buildMode,
      userBudget,
      userTimeline
    });
    
    const systemPromptWithVars = substitutePromptTemplate(systemPrompt, { 
      buildMode,
      userBudget,
      userTimeline
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
    return NextResponse.json({ error: 'Failed to generate build strategy' }, { status: 500 });
  }
}
