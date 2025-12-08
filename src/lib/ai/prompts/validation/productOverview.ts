import { z } from 'zod';
import { ValidationPillarResult } from '@/server/validation/types';

export const AIProductPersonaSchema = z.object({
  name: z.string().min(2).max(60),
  role: z.string().min(3).max(80).optional(),
  summary: z.string().min(20).max(220),
  needs: z.array(z.string().min(4)).min(2).max(5),
  motivations: z.array(z.string().min(4)).max(4).optional(),
  painPoints: z.array(z.string().min(4)).max(4).optional(),
});

export const AIProductRiskSchema = z.object({
  risk: z.string().min(10).max(200),
  mitigation: z.string().min(10).max(220),
});

export const AIProductMonetisationSchema = z.object({
  model: z.string().min(3).max(80),
  description: z.string().min(15).max(240),
  pricingNotes: z.string().min(8).max(200).optional(),
});

export const AIProductOverviewSchema = z.object({
  aiProductOverview: z.object({
    refinedPitch: z.string().min(20).max(320),
    problemSummary: z.string().min(30).max(320),
    personas: z.array(AIProductPersonaSchema).min(1).max(4),
    solution: z.string().min(40).max(400),
    coreFeatures: z.array(z.string().min(4).max(140)).min(1).max(10),
    uniqueValue: z.string().min(25).max(320),
    competition: z.string().min(25).max(320),
    marketSize: z.string().min(25).max(320),
    risks: z.array(AIProductRiskSchema).min(1).max(5),
    monetisation: z.array(AIProductMonetisationSchema).min(1).max(4),
    buildNotes: z.string().min(25).max(360),
  }),
});

export interface ProductOverviewPromptInput {
  title: string;
  summary: string;
  context?: string;
  pillars: ValidationPillarResult[];
}

