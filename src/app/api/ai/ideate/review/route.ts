import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIConfig, substitutePromptTemplate, defaultAIConfigs } from "@/lib/aiConfig";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { 
      mode, 
      userInput, 
      selectedIdea,
      targetMarket,
      targetCountry,
      budget,
      timescales
    } = await req.json();
    
    // Get AI configuration from database
    const config = await getAIConfig('ideate');
    const fallbackConfig = defaultAIConfigs.ideate;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    
    // Get review system prompt from config (with fallback to default)
    const systemPromptReview = (config as any)?.system_prompt_review || (fallbackConfig as any)?.system_prompt_review || "";
    
    // Get review user prompt template from config (with fallback to default)
    const userPromptTemplateReview = (config as any)?.user_prompt_template_review || (fallbackConfig as any)?.user_prompt_template_review || "";
    
    // Build context for the review
    let ideaContext = '';
    if (mode === 'surprise-me' && selectedIdea) {
      ideaContext = `Selected Idea:\nTitle: ${selectedIdea.title}\nDescription: ${selectedIdea.description}`;
    } else if (mode === 'explore-idea' && userInput) {
      ideaContext = `Idea to Explore:\n${userInput}`;
    } else if (mode === 'solve-problem' && userInput) {
      ideaContext = `Problem to Solve:\n${userInput}`;
    }
    
    // Build additional context
    let additionalContext = '';
    if (targetMarket) {
      additionalContext += `\nTarget Market: ${targetMarket}`;
    }
    if (targetCountry) {
      additionalContext += `\nTarget Country: ${targetCountry}`;
    }
    if (budget) {
      additionalContext += `\nBudget: ${budget}`;
    }
    if (timescales) {
      additionalContext += `\nTimescales: ${timescales}`;
    }
    
    // Use configured system prompt or fallback to hardcoded default if not configured
    const systemPrompt = systemPromptReview || `You are an expert startup advisor and AI consultant with 15+ years of experience evaluating startup ideas. Your role is to provide a comprehensive, honest, and actionable review of startup ideas.

Provide your review in the following structured format using markdown:

## Overall Assessment
Start with a brief summary of the idea and your initial impression. Reference specific details from the user's input.

## What I Noticed in Your Description
- **Target Audience**: Identify who the user mentioned or who should be targeted
- **Problem Indicators**: Note specific problems or pain points mentioned
- **Solution Approach**: Identify how the user is thinking about solving this
- **Technology Stack**: Mention any tech discussed (AI, platform, app, etc.)
- **Market Context**: Note any market or industry mentions

## Strengths I've Identified
List 3-5 specific strengths based on what the user actually wrote. Be specific and reference their input.

## Critical Questions to Answer
1. **Market Size**: What's the total addressable market? Be specific.
2. **Willingness to Pay**: Will people pay for this? Reference their budget if provided.
3. **Competitive Differentiation**: What makes this different? What's the unique angle?
4. **Execution Feasibility**: Can this realistically be built? Reference their timeline if provided.

## Recommendations Tailored to Your Input
Provide 3-4 specific recommendations based on:
- Their mode (explore idea vs solve problem vs surprise me)
- Their input length and detail level
- Their budget and timeline constraints
- The specific market/industry they mentioned

## Market-Specific Insights
- Sector Analysis: If they mentioned a market (Healthcare, Fintech, etc.), provide specific insights
- Geographic Considerations: If they mentioned a country, provide market-specific advice
- Budget Considerations: If they provided a budget, give realistic expectations
- Timeline Reality Check: If they provided a timeline, assess if it's realistic

## Next Steps Prioritized
Provide a week-by-week or month-by-month action plan based on their timeline.

## Final Assessment
- Overall Recommendation: Clear recommendation based on their specific input
- Risk Assessment: Specific risks based on their idea and constraints
- Success Probability: Realistic percentage based on what they've provided

Be specific, reference their actual words, and provide actionable advice. Don't be generic - tailor everything to their specific input.`;

    // Build user prompt from template or fallback to hardcoded default
    let userPrompt: string;
    if (userPromptTemplateReview) {
      // Use template with variable substitution
      const variables = {
        mode: mode || '',
        ideaContext: ideaContext || '',
        additionalContext: additionalContext || ''
      };
      userPrompt = substitutePromptTemplate(userPromptTemplateReview, variables);
    } else {
      // Fallback to hardcoded prompt for backward compatibility
      const ideaType = mode === 'surprise-me' ? 'idea' : mode === 'explore-idea' ? 'idea' : 'problem';
      userPrompt = `Please provide a comprehensive AI review for this startup ${ideaType}:

${ideaContext}${additionalContext}

Analyze this thoroughly and provide specific, actionable feedback. Reference their actual input and be specific rather than generic.`;
    }

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
    return NextResponse.json({ error: 'Failed to generate AI review' }, { status: 500 });
  }
}

