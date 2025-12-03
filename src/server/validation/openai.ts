import OpenAI from 'openai';
import { AgentResult, AgentScoreKey } from './types';

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

interface AgentResponse {
  score: number;
  rationale: string;
  signals?: string[];
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

interface JsonPromptOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
}

interface JsonPromptResult<T> {
  data: T;
  meta: {
    tokens?: number;
    duration: number;
  };
}

export async function callJsonPrompt<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.6,
  timeoutMs = 30000,
}: JsonPromptOptions): Promise<JsonPromptResult<T>> {
  const startTime = Date.now();

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature,
      });

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as T;
      return {
        parsed,
        tokens: completion.usage?.total_tokens,
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  });

  return {
    data: response.parsed,
    meta: {
      tokens: response.tokens,
      duration: Date.now() - startTime,
    },
  };
}

/**
 * Call OpenAI with structured JSON response
 */
export async function callValidationAgent(
  key: AgentScoreKey,
  systemPrompt: string,
  userPrompt: string
): Promise<AgentResult> {
  const { data, meta } = await callJsonPrompt<AgentResponse>({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
  });

  return {
    key,
    score: clampScore(data.score || 50),
    rationale: (data.rationale || 'No rationale provided').substring(0, 600),
    meta: {
      model: MODEL,
      tokens: meta.tokens,
      duration: meta.duration,
      signals: data.signals || [],
    },
  };
}

