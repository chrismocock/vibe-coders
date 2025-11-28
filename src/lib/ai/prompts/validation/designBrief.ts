import { z } from 'zod';
import { DesignBrief, FeatureMap, Persona } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface DesignBriefPromptInput {
  title: string;
  summary?: string;
  personas?: string;
  featureMap?: string;
  opportunityScore?: string;
  riskRadar?: string;
  ideaEnhancement?: string;
}

const PersonaSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(15).max(100).optional(),
  role: z.string().min(2).max(80).optional(),
  description: z.string().min(10).max(280).optional(),
  goals: z.array(z.string().min(3)).min(1),
  pains: z.array(z.string().min(3)).min(1),
  triggers: z.array(z.string().min(3)).min(1),
  objections: z.array(z.string().min(3)).min(1),
  solutionFit: z.array(z.string().min(3)).min(1),
  neededFeatures: z.array(z.string().min(3)).min(1),
});

const FeatureMapSchema = z.object({
  must: z.array(z.string().min(3)).min(3).max(8),
  should: z.array(z.string().min(3)).min(2).max(8),
  could: z.array(z.string().min(3)).min(1).max(6),
  avoid: z.array(z.string().min(3)).min(1).max(6),
});

const DesignBriefSchema = z.object({
  personas: z.array(PersonaSchema).min(2).max(4),
  coreProblems: z.array(z.string().min(3)).min(3).max(10),
  featureSet: FeatureMapSchema,
  positioning: z.string().min(30).max(500),
  pricing: z.string().min(20).max(400),
  competitorGaps: z.array(z.string().min(3)).min(2).max(8),
  valueProposition: z.string().min(30).max(300),
  messaging: z.array(z.string().min(10)).min(3).max(8),
  initialUIIdeas: z.array(z.string().min(10)).min(3).max(8),
});

const DesignBriefResponseSchema = z.object({
  brief: DesignBriefSchema,
});

export async function generateDesignBrief(input: DesignBriefPromptInput): Promise<DesignBrief> {
  const systemPrompt = `You are an AI product leader. You convert validation results into a fully-formed design brief that product designers can work from immediately.

Only return valid JSON as specified. No markdown, no commentary.`;

  const userPrompt = `Create a design-stage ready brief using the AI validation outputs.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.personas ? `Personas:\n${input.personas}\n` : ''}
${input.featureMap ? `Feature Map:\n${input.featureMap}\n` : ''}
${input.opportunityScore ? `Opportunity Score:\n${input.opportunityScore}\n` : ''}
${input.riskRadar ? `Risk Radar:\n${input.riskRadar}\n` : ''}
${input.ideaEnhancement ? `Idea Enhancer Insights:\n${input.ideaEnhancement}\n` : ''}

Deliver JSON:
{
  "brief": {
    "personas": [...],
    "coreProblems": ["..."],
    "featureSet": {
      "must": ["..."],
      "should": ["..."],
      "could": ["..."],
      "avoid": ["..."]
    },
    "positioning": "...",
    "pricing": "...",
    "competitorGaps": ["..."],
    "valueProposition": "...",
    "messaging": ["..."],
    "initialUIIdeas": ["..."]
  }
}`;

  const result = await runStructuredPrompt(DesignBriefResponseSchema, systemPrompt, userPrompt);

  const personas: Persona[] = result.brief.personas.map((persona) => ({
    name: persona.name,
    age: persona.age,
    role: persona.role,
    description: persona.description,
    goals: persona.goals,
    pains: persona.pains,
    triggers: persona.triggers,
    objections: persona.objections,
    solutionFit: persona.solutionFit,
    neededFeatures: persona.neededFeatures,
  }));

  const featureSet: FeatureMap = result.brief.featureSet;

  return {
    personas,
    coreProblems: result.brief.coreProblems,
    featureSet,
    positioning: result.brief.positioning,
    pricing: result.brief.pricing,
    competitorGaps: result.brief.competitorGaps,
    valueProposition: result.brief.valueProposition,
    messaging: result.brief.messaging,
    initialUIIdeas: result.brief.initialUIIdeas,
  };
}


