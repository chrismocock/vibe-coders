import { getAgents } from './agents';
import { ValidationReport, AgentScoreKey, AgentMetadata } from './types';

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
  
  return {
    projectId,
    ideaTitle: idea.title,
    ideaSummary: idea.summary,
    scores,
    overallConfidence,
    recommendation,
    rationales,
    agentDetails,
  } satisfies ValidationReport;
}

