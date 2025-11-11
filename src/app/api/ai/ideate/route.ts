import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { mode, market, input, constraints } = await req.json();
    
    // Get AI configuration from database
    const config = await getAIConfig('ideate');
    const fallbackConfig = defaultAIConfigs.ideate;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    const systemPrompt = config?.system_prompt || fallbackConfig?.system_prompt || "";
    const userPromptTemplate = config?.user_prompt_template || fallbackConfig?.user_prompt_template || "";
    const userPromptTemplateIdea = (config as any)?.user_prompt_template_idea || (fallbackConfig as any)?.user_prompt_template_idea || "";
    const userPromptTemplateProblem = (config as any)?.user_prompt_template_problem || (fallbackConfig as any)?.user_prompt_template_problem || "";
    const systemPromptIdea = (config as any)?.system_prompt_idea || (fallbackConfig as any)?.system_prompt_idea || "";
    const systemPromptProblem = (config as any)?.system_prompt_problem || (fallbackConfig as any)?.system_prompt_problem || "";
    const systemPromptSurprise = (config as any)?.system_prompt_surprise || (fallbackConfig as any)?.system_prompt_surprise || "";
    
    // Build the context for the AI
    const context = {
      mode: mode || 'Problem to Solve',
      market: market || null,
      input: input || '',
      constraints: constraints || ''
    };
    
    // Select mode-specific system prompt
    let systemPromptToUse = systemPrompt;
    if (mode === 'Surprise Me' && systemPromptSurprise?.trim()) {
      systemPromptToUse = systemPromptSurprise;
    } else if (mode === 'Idea to Explore' && systemPromptIdea?.trim()) {
      systemPromptToUse = systemPromptIdea;
    } else if (mode === 'Problem to Solve' && systemPromptProblem?.trim()) {
      systemPromptToUse = systemPromptProblem;
    }
    
    // Build user prompt based on mode and template
    let userPrompt = '';
    
    if (mode === 'Surprise Me') {
      // For Surprise Me mode, rely entirely on the system prompt from admin configuration
      // Only add market preference if provided - don't override system prompt instructions
      if (market) {
        userPrompt = `Focus on the ${market} market/industry.`;
      } else {
        // Minimal prompt - let the system prompt handle all instructions
        userPrompt = 'Please generate the startup ideas as specified.';
      }
    } else {
      // Use mode-specific template or fallback to generic
      const templateForMode = mode === 'Idea to Explore' ? userPromptTemplateIdea : userPromptTemplateProblem;
      const templateToUse = templateForMode?.trim() ? templateForMode : userPromptTemplate;

      console.log('Template being used:', templateToUse);
      console.log('Input value:', input);
      
      // Substitute template variables
      userPrompt = substitutePromptTemplate(templateToUse, { 
        input: input || '',
        mode: context.mode,
        market: context.market ?? '',
        constraints: context.constraints
      });
      
      console.log('After substitution:', userPrompt);
      
      // Add constraints and market if provided
      if (constraints) {
        userPrompt += `\n\nConstraints/Requirements: ${constraints}`;
      }
      if (market) {
        userPrompt += `\n\nTarget Market: ${market}`;
      } else {
        userPrompt += `\n\nPlease suggest the most relevant target market(s) for each idea.`;
      }
    }
    
    // Debug logging
    console.log('=== IDEATE API DEBUG ===');
    console.log('Mode:', mode);
    console.log('System Prompt:', systemPromptToUse.substring(0, 100) + '...');
    console.log('User Prompt:', userPrompt);
    console.log('========================');
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { 
          role: "system", 
          content: systemPromptToUse
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
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
  }
}


