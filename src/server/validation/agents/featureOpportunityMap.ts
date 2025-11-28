import {
  FeatureMapPromptInput,
  generateFeatureOpportunityMap,
} from '@/lib/ai/prompts/validation/featureMap';
import { FeatureMap } from '../types';

export async function runFeatureOpportunityMapAgent(input: FeatureMapPromptInput): Promise<FeatureMap> {
  return generateFeatureOpportunityMap(input);
}

