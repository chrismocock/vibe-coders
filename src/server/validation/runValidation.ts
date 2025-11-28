import {
  getAgents,
  runFeatureOpportunityMapAgent,
  runIdeaEnhancerAgent,
  runOpportunityScoreAgent,
  runPersonaModelsAgent,
  runRiskRadarAgent,
} from './agents';
import {
  ValidationReport,
  AgentScoreKey,
  AgentMetadata,
  Persona,
  FeatureMap,
  IdeaEnhancement,
  OpportunityScore,
  RiskRadar,
} from './types';
import {
  formatFeatureMap,
  formatPersonas,
  formatScoresForPrompt,
} from './formatters';

export async function runValidation(projectId: string, idea: { title: string; summary?: string; aiReview?: string }): Promise<ValidationReport> {
  const agents = getAgents();
  
  // Run all agents in parallel
  const results = await Promise.all(
    agents.map((a) => a.run({ title: idea.title, summary: idea.summary, aiReview: idea.aiReview }))
  );
  
  // Aggregate scores
  const scores = results.reduce<Record<AgentScoreKey, number>>((acc, r) => {
    acc[r.key] = r.score;
    return acc;
  }, {} as Record<AgentScoreKey, number>);
  
  // Aggregate rationales
  const rationales = results.reduce<Partial<Record<AgentScoreKey, string>>>((acc, r) => {
    acc[r.key] = r.rationale;
    return acc;
  }, {});
  
  // Calculate weighted overall confidence
  const totalWeight = agents.reduce((s, a) => s + a.weight, 0) || 1;
  const weighted = results.reduce((s, r, idx) => s + r.score * (agents[idx].weight || 1), 0) / totalWeight;
  const overallConfidence = Math.round(weighted);
  
  // Determine recommendation
  const recommendation: 'build' | 'revise' | 'drop' = 
    overallConfidence >= 70 ? 'build' : 
    overallConfidence >= 40 ? 'revise' : 
    'drop';
  
  // Aggregate agent metadata
  const agentDetails: Record<string, AgentMetadata> = {};
  results.forEach((r) => {
    if (r.meta) {
      // Ensure meta has required AgentMetadata fields
      const meta = r.meta as unknown as AgentMetadata;
      if (meta.model) {
        agentDetails[r.key] = meta;
      }
    }
  });
  
  const baseReport: ValidationReport = {
    projectId,
    ideaTitle: idea.title,
    ideaSummary: idea.summary,
    scores,
    overallConfidence,
    recommendation,
    rationales,
    agentDetails,
  };

  // Generate enhanced insights sequentially using base results
  const marketSignals = rationales.marketDemand ?? '';
  const audienceSignals = rationales.audienceFit ?? '';
  const feasibilitySignals = rationales.feasibility ?? '';
  const competitionSignals = rationales.competition ?? '';
  const monetisationSignals = rationales.pricingPotential ?? '';

  let opportunityScore: OpportunityScore | null = null;
  let riskRadar: RiskRadar | null = null;
  let personas: Persona[] | null = null;
  let featureMap: FeatureMap | null = null;
  let ideaEnhancement: IdeaEnhancement | null = null;

  const scoreSummary = formatScoresForPrompt(baseReport);

  try {
    opportunityScore = await runOpportunityScoreAgent({
      title: idea.title,
      summary: idea.summary,
      marketSignals,
      audienceSignals,
      feasibilitySignals,
    });
  } catch (error) {
    console.warn('Failed to generate opportunity score', error);
  }

  try {
    riskRadar = await runRiskRadarAgent({
      title: idea.title,
      summary: idea.summary,
      marketSignals,
      competitionSignals,
      technicalSignals: feasibilitySignals,
      monetisationSignals,
      gtmSignals: idea.aiReview,
    });
  } catch (error) {
    console.warn('Failed to generate risk radar', error);
  }

  try {
    personas = await runPersonaModelsAgent({
      title: idea.title,
      summary: idea.summary,
      aiReview: scoreSummary,
    });
  } catch (error) {
    console.warn('Failed to generate personas', error);
  }

  let personasText = '';
  if (personas) {
    personasText = formatPersonas(personas);
  }

  try {
    featureMap = await runFeatureOpportunityMapAgent({
      title: idea.title,
      summary: idea.summary,
      personas: personasText,
      insights: scoreSummary,
    });
  } catch (error) {
    console.warn('Failed to generate feature opportunity map', error);
  }

  let featureMapText = '';
  if (featureMap) {
    featureMapText = formatFeatureMap(featureMap);
  }

  try {
    ideaEnhancement = await runIdeaEnhancerAgent({
      title: idea.title,
      summary: idea.summary,
      aiReview: scoreSummary,
      personas: personasText,
      featureMap: featureMapText,
      competitorNotes: competitionSignals,
    });
  } catch (error) {
    console.warn('Failed to generate idea enhancement', error);
  }

  return {
    ...baseReport,
    opportunityScore: opportunityScore || null,
    riskRadar: riskRadar || null,
    personas: personas || null,
    featureMap: featureMap || null,
    ideaEnhancement: ideaEnhancement || null,
  };
}

