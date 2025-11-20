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
      timescales,
      aiReview
    } = await req.json();
    
    if (!aiReview) {
      return NextResponse.json({ error: 'AI Review is required' }, { status: 400 });
    }
    
    // Get AI configuration from database
    const config = await getAIConfig('ideate');
    const fallbackConfig = defaultAIConfigs.ideate;
    
    const model = config?.model || fallbackConfig?.model || "gpt-4o-mini";
    
    // Get initial feedback system prompt from config (with fallback to default)
    const systemPromptInitialFeedback = (config as any)?.system_prompt_initial_feedback || (fallbackConfig as any)?.system_prompt_initial_feedback || "";
    
    // Get initial feedback user prompt template from config (with fallback to default)
    const userPromptTemplateInitialFeedback = (config as any)?.user_prompt_template_initial_feedback || (fallbackConfig as any)?.user_prompt_template_initial_feedback || "";
    
    // Build context for the feedback
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
    const systemPrompt = systemPromptInitialFeedback || `You are an expert startup evaluator providing quick initial feedback on startup ideas. Based on the AI review provided, analyze the idea across 5 key dimensions and provide a structured assessment.

**CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations outside the JSON structure.**

Your response must be a JSON object with this exact structure:
{
  "recommendation": "build" | "revise" | "drop",
  "overallConfidence": number (0-100),
  "scores": {
    "audienceFit": { "score": number (0-100), "rationale": "string" },
    "competition": { "score": number (0-100), "rationale": "string" },
    "marketDemand": { "score": number (0-100), "rationale": "string" },
    "feasibility": { "score": number (0-100), "rationale": "string" },
    "pricingPotential": { "score": number (0-100), "rationale": "string" }
  }
}

**Scoring Guidelines:**
- **audienceFit**: How well-defined and accessible is the target audience? (0-100)
- **competition**: How competitive is the market? Lower score = more competitive/challenging (0-100)
- **marketDemand**: How strong is the demand for this solution? (0-100)
- **feasibility**: How realistic is it to build this with given resources? (0-100)
- **pricingPotential**: How likely are customers to pay for this? (0-100)

**Recommendation Logic:**
- "build": overallConfidence >= 70
- "revise": overallConfidence >= 40 and < 70
- "drop": overallConfidence < 40

**Overall Confidence Calculation:**
Calculate as weighted average: (audienceFit * 0.2 + competition * 0.2 + marketDemand * 0.25 + feasibility * 0.15 + pricingPotential * 0.2)

**Rationale Requirements:**
- Each rationale should be 1-2 sentences
- Reference specific points from the AI review
- Be honest and constructive
- Focus on actionable insights

Respond with ONLY the JSON object, no other text.`;

    // Build user prompt from template or fallback to hardcoded default
    let userPrompt: string;
    if (userPromptTemplateInitialFeedback) {
      // Use template with variable substitution
      const variables = {
        mode: mode || '',
        ideaContext: ideaContext || '',
        additionalContext: additionalContext || '',
        aiReview: aiReview || ''
      };
      userPrompt = substitutePromptTemplate(userPromptTemplateInitialFeedback, variables);
    } else {
      // Fallback to hardcoded prompt for backward compatibility
      userPrompt = `Based on the following AI review and idea details, provide initial feedback with scores and recommendations:

Idea Context:
${ideaContext}${additionalContext}

AI Review:
${aiReview}

Provide structured feedback with scores for each validation dimension.`;
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
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    // Parse JSON response
    let feedbackData;
    try {
      feedbackData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', content);
      throw new Error('Invalid JSON response from AI');
    }
    
    // Validate and normalize the response structure
    const validatedData = {
      recommendation: feedbackData.recommendation || 'revise',
      overallConfidence: Math.round(feedbackData.overallConfidence || 50),
      scores: {
        audienceFit: {
          score: Math.round(feedbackData.scores?.audienceFit?.score || 50),
          rationale: feedbackData.scores?.audienceFit?.rationale || 'No rationale provided'
        },
        competition: {
          score: Math.round(feedbackData.scores?.competition?.score || 50),
          rationale: feedbackData.scores?.competition?.rationale || 'No rationale provided'
        },
        marketDemand: {
          score: Math.round(feedbackData.scores?.marketDemand?.score || 50),
          rationale: feedbackData.scores?.marketDemand?.rationale || 'No rationale provided'
        },
        feasibility: {
          score: Math.round(feedbackData.scores?.feasibility?.score || 50),
          rationale: feedbackData.scores?.feasibility?.rationale || 'No rationale provided'
        },
        pricingPotential: {
          score: Math.round(feedbackData.scores?.pricingPotential?.score || 50),
          rationale: feedbackData.scores?.pricingPotential?.rationale || 'No rationale provided'
        }
      }
    };
    
    // Ensure recommendation is valid
    if (!['build', 'revise', 'drop'].includes(validatedData.recommendation)) {
      validatedData.recommendation = 'revise';
    }
    
    // Recalculate overall confidence if needed (weighted average)
    const weights = {
      audienceFit: 0.2,
      competition: 0.2,
      marketDemand: 0.25,
      feasibility: 0.15,
      pricingPotential: 0.2
    };
    
    const calculatedConfidence = Math.round(
      validatedData.scores.audienceFit.score * weights.audienceFit +
      validatedData.scores.competition.score * weights.competition +
      validatedData.scores.marketDemand.score * weights.marketDemand +
      validatedData.scores.feasibility.score * weights.feasibility +
      validatedData.scores.pricingPotential.score * weights.pricingPotential
    );
    
    validatedData.overallConfidence = calculatedConfidence;
    
    // Update recommendation based on calculated confidence
    if (calculatedConfidence >= 70) {
      validatedData.recommendation = 'build';
    } else if (calculatedConfidence >= 40) {
      validatedData.recommendation = 'revise';
    } else {
      validatedData.recommendation = 'drop';
    }
    
    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to generate initial feedback' }, { status: 500 });
  }
}

