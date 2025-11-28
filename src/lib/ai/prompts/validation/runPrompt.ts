import OpenAI from 'openai';
import { z } from 'zod';

const MODEL = process.env.OPENAI_GPT5_MODEL || 'gpt-4o';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for validation prompts');
  }
  return new OpenAI({ apiKey });
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown error');
}

interface RunPromptOptions {
  temperature?: number;
  maxDurationMs?: number;
}

export async function runStructuredPrompt<T>(
  schema: z.ZodSchema<T>,
  systemPrompt: string,
  userPrompt: string,
  options: RunPromptOptions = {}
): Promise<T> {
  const startTime = Date.now();
  const timeoutMs = options.maxDurationMs ?? 45000;

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
        temperature: options.temperature ?? 0.6,
      });

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Prompt timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  });

  return response;
}


