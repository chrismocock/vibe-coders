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

