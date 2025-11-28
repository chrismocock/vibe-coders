import { z } from 'zod';
import { SectionDeepDive, ValidationSection } from '@/server/validation/types';
import { runStructuredPrompt } from './runPrompt';

export interface DeepDivePromptInput {
  section: ValidationSection;
  title: string;
  summary?: string;
  sectionInsights?: string;
  personas?: string;
  featureMap?: string;
  ideaEnhancement?: string;
}

const DeepDiveSchema: z.ZodType<SectionDeepDive> = z.object({
  summary: z.string().min(30).max(400),
  signals: z.array(z.string().min(3)).min(3).max(8),
  researchFindings: z.array(z.string().min(3)).min(2).max(6),
  competitorInsights: z.array(z.string().min(3)).min(1).max(5),
  pricingAngles: z.array(z.string().min(3)).min(1).max(4),
  audienceAngles: z.array(z.string().min(3)).min(1).max(5),
  featureOpportunities: z.array(z.string().min(3)).min(1).max(5),
  nextSteps: z.array(z.string().min(3)).min(2).max(6),
});

export async function generateDeepDiveInsights(input: DeepDivePromptInput): Promise<SectionDeepDive> {
  const systemPrompt = `You are an AI product strategist providing deeper analysis for validation reviewers. Deliver advanced signals and recommendations that go beyond the initial section output.

Return ONLY valid JSON. No markdown.`;

  const sectionLabel = input.section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const userPrompt = `Provide a deeper analysis for the ${sectionLabel} section.

Idea Title: ${input.title}
${input.summary ? `Idea Summary:\n${input.summary}\n` : ''}
${input.sectionInsights ? `${sectionLabel} Insights:\n${input.sectionInsights}\n` : ''}
${input.personas ? `Personas:\n${input.personas}\n` : ''}
${input.featureMap ? `Feature Map:\n${input.featureMap}\n` : ''}
${input.ideaEnhancement ? `Idea Enhancer Insights:\n${input.ideaEnhancement}\n` : ''}

Output JSON:
{
  "summary": "...",
  "signals": ["..."],
  "researchFindings": ["..."],
  "competitorInsights": ["..."],
  "pricingAngles": ["..."],
  "audienceAngles": ["..."],
  "featureOpportunities": ["..."],
  "nextSteps": ["..."]
}

Guidelines:
- Keep each list concise and insight-rich.
- Tailor recommendations to the section focus.
- Use data-driven phrasing where possible.`;

  return runStructuredPrompt(DeepDiveSchema, systemPrompt, userPrompt);
}


