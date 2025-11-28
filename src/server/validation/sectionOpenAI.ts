import OpenAI from 'openai';
import { SectionResult } from './types';

// Use GPT-5 if available, fallback to gpt-4o
const MODEL = process.env.OPENAI_GPT5_MODEL || 'gpt-4o';

/**
 * Get OpenAI client instance (lazy initialization)
 */
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for validation');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface SectionResponse {
  score: number;
  summary: string;
  actions: string[];
  insightBreakdown?: {
    discoveries?: string;
    meaning?: string;
    impact?: string;
    recommendations?: string;
  };
  suggestions?: {
    features?: string[];
    positioning?: string[];
    audience?: string[];
    copy?: string[];
  };
}

/**
 * Helper to clamp score to 0-100
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Unknown error');
}

/**
 * Call OpenAI for section validation with structured JSON response
 */
export async function callSectionValidation(
  systemPrompt: string,
  userPrompt: string
): Promise<SectionResult> {
  const startTime = Date.now();

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as SectionResponse;

      // Validate and normalize response
      const score = clampScore(parsed.score || 50);
      const summary = (parsed.summary || 'No summary provided').trim();
      const actions = Array.isArray(parsed.actions) 
        ? parsed.actions.filter((a): a is string => typeof a === 'string' && a.length > 0).slice(0, 5)
        : [];

      if (actions.length === 0) {
        throw new Error('No valid actions returned from OpenAI');
      }

      const insightBreakdown = {
        discoveries: parsed.insightBreakdown?.discoveries || summary,
        meaning: parsed.insightBreakdown?.meaning || '',
        impact: parsed.insightBreakdown?.impact || '',
        recommendations: parsed.insightBreakdown?.recommendations || '',
      };

      const suggestions = {
        features: Array.isArray(parsed.suggestions?.features)
          ? parsed.suggestions?.features.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 6)
          : [],
        positioning: Array.isArray(parsed.suggestions?.positioning)
          ? parsed.suggestions?.positioning.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 6)
          : [],
        audience: Array.isArray(parsed.suggestions?.audience)
          ? parsed.suggestions?.audience.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 6)
          : [],
        copy: Array.isArray(parsed.suggestions?.copy)
          ? parsed.suggestions?.copy.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 6)
          : [],
      };

      return {
        score,
        summary,
        actions,
        insightBreakdown,
        suggestions,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }
      throw error;
    }
  });

  return response;
}

