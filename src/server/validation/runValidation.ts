import { getAgents } from './agents';
import { ValidationReport, AgentScoreKey } from './types';

export async function runValidation(projectId: string, idea: { title: string; summary?: string }): Promise<ValidationReport> {
  const agents = getAgents();
  const results = await Promise.all(agents.map((a) => a.run({ title: idea.title, summary: idea.summary })));
  
  const scores = results.reduce<Record<AgentScoreKey, number>>((acc, r) => {
    acc[r.key] = r.score;
    return acc;
  }, {} as any);
  
  const rationales = results.reduce<Partial<Record<AgentScoreKey, string>>>((acc, r) => {
    acc[r.key] = r.rationale;
    return acc;
  }, {});
  
  const totalWeight = agents.reduce((s, a) => s + a.weight, 0) || 1;
  const weighted = results.reduce((s, r, idx) => s + r.score * (agents[idx].weight || 1), 0) / totalWeight;
  const overallConfidence = Math.round(weighted);
  
  const recommendation: 'build' | 'revise' | 'drop' = 
    overallConfidence >= 70 ? 'build' : 
    overallConfidence >= 40 ? 'revise' : 
    'drop';
  
  return {
    projectId,
    ideaTitle: idea.title,
    ideaSummary: idea.summary,
    scores,
    overallConfidence,
    recommendation,
    rationales,
  } satisfies ValidationReport;
}

