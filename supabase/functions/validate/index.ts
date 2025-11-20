// Supabase Edge Function for validation
// Runs 5 validation agents in parallel using OpenAI
// @ts-expect-error: URL import is valid in the edge runtime but not resolved by TS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno for type checking in the edge runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

interface AgentResult {
  key: string;
  score: number;
  rationale: string;
  signals?: string[];
  meta?: {
    model: string;
    tokens?: number;
    duration?: number;
  };
}

interface ValidationReport {
  scores: Record<string, number>;
  overallConfidence: number;
  recommendation: 'build' | 'revise' | 'drop';
  rationales: Record<string, string>;
  agentDetails: Record<string, unknown>;
}

// Helper to clamp score to 0-100
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper to retry with exponential backoff
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

// Market Demand Agent
async function runMarketDemandAgent(
  ideaTitle: string,
  ideaSummary: string,
  openaiApiKey: string
): Promise<AgentResult> {
  const startTime = Date.now();
  const model = 'gpt-4o-mini';

  const prompt = `You are a market research analyst evaluating startup ideas. Analyze the market demand for this idea:

Title: ${ideaTitle}
${ideaSummary ? `Summary: ${ideaSummary}` : ''}

Evaluate:
1. Market size and growth potential (TAM/SAM/SOM proxy)
2. Search interest and trend signals
3. Budget allocation signals in target market
4. Problem urgency and frequency
5. Willingness to pay indicators

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Strong demand, large/growing market, high urgency
- 60-79: Moderate demand, viable market size
- 40-59: Weak demand, niche market, low urgency
- 0-39: Very weak demand, declining market, no clear need`;

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a market research analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return {
        key: 'marketDemand',
        score: clampScore(parsed.score || 50),
        rationale: (parsed.rationale || 'No rationale provided').substring(0, 600),
        signals: parsed.signals || [],
        meta: {
          model,
          tokens: data.usage?.total_tokens,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  return response;
}

// Competition Agent
async function runCompetitionAgent(
  ideaTitle: string,
  ideaSummary: string,
  openaiApiKey: string
): Promise<AgentResult> {
  const startTime = Date.now();
  const model = 'gpt-4o-mini';

  const prompt = `You are a competitive analysis expert. Evaluate the competitive landscape for this idea:

Title: ${ideaTitle}
${ideaSummary ? `Summary: ${ideaSummary}` : ''}

Evaluate:
1. Direct and indirect competitors
2. Market saturation level
3. Competitive moats and differentiation potential
4. Switching costs for customers
5. Barriers to entry

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Low competition, strong differentiation, high barriers
- 60-79: Moderate competition, some differentiation
- 40-59: High competition, weak differentiation
- 0-39: Saturated market, no clear advantage`;

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a competitive analysis expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return {
        key: 'competition',
        score: clampScore(parsed.score || 50),
        rationale: (parsed.rationale || 'No rationale provided').substring(0, 600),
        signals: parsed.signals || [],
        meta: {
          model,
          tokens: data.usage?.total_tokens,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  return response;
}

// Audience Fit Agent
async function runAudienceFitAgent(
  ideaTitle: string,
  ideaSummary: string,
  openaiApiKey: string
): Promise<AgentResult> {
  const startTime = Date.now();
  const model = 'gpt-4o-mini';

  const prompt = `You are a customer research expert. Evaluate how well this idea fits its target audience:

Title: ${ideaTitle}
${ideaSummary ? `Summary: ${ideaSummary}` : ''}

Evaluate:
1. Ideal Customer Profile (ICP) clarity
2. Problem urgency and pain level
3. Willingness to pay and budget availability
4. Product-market fit potential
5. User acquisition feasibility

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Clear ICP, high urgency, strong willingness to pay
- 60-79: Defined audience, moderate urgency
- 40-59: Unclear audience, low urgency
- 0-39: No clear audience, no willingness to pay`;

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a customer research expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return {
        key: 'audienceFit',
        score: clampScore(parsed.score || 50),
        rationale: (parsed.rationale || 'No rationale provided').substring(0, 600),
        signals: parsed.signals || [],
        meta: {
          model,
          tokens: data.usage?.total_tokens,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  return response;
}

// Feasibility Agent
async function runFeasibilityAgent(
  ideaTitle: string,
  ideaSummary: string,
  openaiApiKey: string
): Promise<AgentResult> {
  const startTime = Date.now();
  const model = 'gpt-4o-mini';

  const prompt = `You are a technical feasibility analyst. Evaluate how feasible this idea is to build:

Title: ${ideaTitle}
${ideaSummary ? `Summary: ${ideaSummary}` : ''}

Evaluate:
1. Technical complexity and required expertise
2. Dependencies and infrastructure needs
3. Regulatory and compliance requirements
4. Time to market estimates
5. Resource requirements (team, budget, tools)

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: Low complexity, minimal dependencies, fast to build
- 60-79: Moderate complexity, manageable dependencies
- 40-59: High complexity, significant dependencies
- 0-39: Very high complexity, major blockers, regulatory issues`;

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a technical feasibility analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return {
        key: 'feasibility',
        score: clampScore(parsed.score || 50),
        rationale: (parsed.rationale || 'No rationale provided').substring(0, 600),
        signals: parsed.signals || [],
        meta: {
          model,
          tokens: data.usage?.total_tokens,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  return response;
}

// Pricing Potential Agent
async function runPricingPotentialAgent(
  ideaTitle: string,
  ideaSummary: string,
  openaiApiKey: string
): Promise<AgentResult> {
  const startTime = Date.now();
  const model = 'gpt-4o-mini';

  const prompt = `You are a pricing strategy expert. Evaluate the pricing potential for this idea:

Title: ${ideaTitle}
${ideaSummary ? `Summary: ${ideaSummary}` : ''}

Evaluate:
1. Viable price points and pricing models
2. Profit margin potential
3. Customer acquisition cost (CAC) vs lifetime value (LTV) ratio
4. Market willingness to pay at different price points
5. Revenue scalability

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "rationale": "<concise explanation <= 600 chars>",
  "signals": ["<signal 1>", "<signal 2>", "<signal 3>"]
}

Score guidelines:
- 80-100: High pricing potential, strong margins, favorable CAC/LTV
- 60-79: Good pricing potential, viable margins
- 40-59: Limited pricing potential, tight margins
- 0-39: Poor pricing potential, unsustainable economics`;

  const response = await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a pricing strategy expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return {
        key: 'pricingPotential',
        score: clampScore(parsed.score || 50),
        rationale: (parsed.rationale || 'No rationale provided').substring(0, 600),
        signals: parsed.signals || [],
        meta: {
          model,
          tokens: data.usage?.total_tokens,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  return response;
}

// Aggregate results and generate recommendation
function aggregateResults(results: AgentResult[]): ValidationReport {
  const scores: Record<string, number> = {};
  const rationales: Record<string, string> = {};
  const agentDetails: Record<string, unknown> = {};

  let totalScore = 0;
  const weights = [1, 1, 1, 1, 1]; // Equal weights for now

  results.forEach((result, index) => {
    scores[result.key] = result.score;
    rationales[result.key] = result.rationale;
    agentDetails[result.key] = {
      score: result.score,
      signals: result.signals || [],
      ...result.meta,
    };
    totalScore += result.score * (weights[index] || 1);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const overallConfidence = Math.round(totalScore / totalWeight);

  let recommendation: 'build' | 'revise' | 'drop';
  if (overallConfidence >= 70) {
    recommendation = 'build';
  } else if (overallConfidence >= 40) {
    recommendation = 'revise';
  } else {
    recommendation = 'drop';
  }

  return {
    scores,
    overallConfidence,
    recommendation,
    rationales,
    agentDetails,
  };
}

Deno.serve(async (req: Request) => {
  try {
    const { projectId, idea } = await req.json();
    
    if (!projectId || !idea?.title) {
      return new Response(
        JSON.stringify({ error: 'projectId and idea.title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert queued row
    const { data: row, error: insErr } = await supabase
      .from('validation_reports')
      .insert({
        project_id: projectId,
        idea_title: idea.title,
        idea_summary: idea.summary || null,
        status: 'running',
      })
      .select('*')
      .single();

    if (insErr) {
      console.error('Error inserting validation report:', insErr);
      return new Response(
        JSON.stringify({ error: insErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Run all agents in parallel
    const ideaTitle = idea.title;
    const ideaSummary = idea.summary || '';

    try {
      const results = await Promise.all([
        runMarketDemandAgent(ideaTitle, ideaSummary, openaiApiKey),
        runCompetitionAgent(ideaTitle, ideaSummary, openaiApiKey),
        runAudienceFitAgent(ideaTitle, ideaSummary, openaiApiKey),
        runFeasibilityAgent(ideaTitle, ideaSummary, openaiApiKey),
        runPricingPotentialAgent(ideaTitle, ideaSummary, openaiApiKey),
      ]);

      // Aggregate results
      const report = aggregateResults(results);

      // Update with results
      const { error: updErr } = await supabase
        .from('validation_reports')
        .update({
          status: 'succeeded',
          scores: report.scores,
          overall_confidence: report.overallConfidence,
          recommendation: report.recommendation,
          rationales: report.rationales,
          agent_details: report.agentDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updErr) {
        console.error('Error updating validation report:', updErr);
        return new Response(
          JSON.stringify({ error: updErr.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ reportId: row.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (agentError) {
      console.error('Error running validation agents:', agentError);
      
      // Update status to failed
      await supabase
        .from('validation_reports')
        .update({
          status: 'failed',
          error: agentError instanceof Error ? agentError.message : String(agentError),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      return new Response(
        JSON.stringify({ error: 'Validation failed', reportId: row.id }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (e) {
    console.error('Validation function error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
