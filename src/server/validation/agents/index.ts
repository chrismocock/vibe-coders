import { ValidationAgent } from '../types';
import { marketDemandAgent } from './marketDemand';
import { competitionAgent } from './competition';
import { audienceFitAgent } from './audienceFit';
import { feasibilityAgent } from './feasibility';
import { pricingPotentialAgent } from './pricingPotential';

export function getAgents(): ValidationAgent[] {
  return [
    marketDemandAgent,
    competitionAgent,
    audienceFitAgent,
    feasibilityAgent,
    pricingPotentialAgent,
  ];
}

export { runPersonaModelsAgent } from './personaModels';
export { runFeatureOpportunityMapAgent } from './featureOpportunityMap';
export { runIdeaEnhancerAgent } from './ideaEnhancer';
export { runPersonaReactionsAgent } from './personaReactions';
export { runOpportunityScoreAgent } from './opportunityScore';
export { runRiskRadarAgent } from './riskRadar';
export { runDesignBriefAgent } from './designBrief';
export { runDeepDiveAgent } from './deepDive';
export { runDecisionSpineAgent } from './decisionSpine';

