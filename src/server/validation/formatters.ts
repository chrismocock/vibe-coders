import {
  FeatureMap,
  IdeaEnhancement,
  OpportunityScore,
  Persona,
  PersonaReaction,
  RiskRadar,
  SectionResult,
  ValidationReport,
  ValidationSection,
} from './types';

export function formatScoresForPrompt(report: ValidationReport): string {
  const entries = Object.entries(report.scores || {});
  if (entries.length === 0) {
    return '';
  }

  return entries
    .map(([key, score]) => {
      const rationale = report.rationales?.[key as keyof typeof report.rationales] ?? 'No rationale captured.';
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase());
      return `${label}: ${score}/100 – ${rationale}`;
    })
    .join('\n');
}

export function formatSectionResult(section: SectionResult | null): string {
  if (!section) {
    return '';
  }

  const insights = section.insightBreakdown
    ? `What we discovered: ${section.insightBreakdown.discoveries}
What this means: ${section.insightBreakdown.meaning}
Impact: ${section.insightBreakdown.impact}
Recommended change: ${section.insightBreakdown.recommendations}`
    : '';

  const actions = section.actions?.length
    ? `Key actions:
- ${section.actions.join('\n- ')}`
    : '';

  return [section.summary, insights, actions].filter(Boolean).join('\n\n');
}

export function formatPersonas(personas?: Persona[] | null): string {
  if (!personas || personas.length === 0) {
    return '';
  }

  return personas
    .map((persona) => {
      const details = [
        `Name: ${persona.name}`,
        persona.age ? `Age: ${persona.age}` : null,
        persona.role ? `Role: ${persona.role}` : null,
        persona.description ? `Profile: ${persona.description}` : null,
        persona.goals?.length ? `Goals: ${persona.goals.join('; ')}` : null,
        persona.pains?.length ? `Pains: ${persona.pains.join('; ')}` : null,
        persona.triggers?.length ? `Triggers: ${persona.triggers.join('; ')}` : null,
        persona.objections?.length ? `Objections: ${persona.objections.join('; ')}` : null,
        persona.solutionFit?.length ? `Solution Fit: ${persona.solutionFit.join('; ')}` : null,
        persona.neededFeatures?.length ? `Needed Features: ${persona.neededFeatures.join('; ')}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      return details;
    })
    .join('\n\n');
}

export function formatFeatureMap(featureMap?: FeatureMap | null): string {
  if (!featureMap) {
    return '';
  }

  return `Must-have: ${featureMap.must.join('; ')}
Should-have: ${featureMap.should.join('; ')}
Could-have: ${featureMap.could.join('; ')}
Avoid: ${featureMap.avoid.join('; ')}`;
}

export function formatIdeaEnhancement(ideaEnhancement?: IdeaEnhancement | null): string {
  if (!ideaEnhancement) {
    return '';
  }

  return `Stronger Positioning: ${ideaEnhancement.strongerPositioning}
Unique Angle: ${ideaEnhancement.uniqueAngle}
Differentiators: ${ideaEnhancement.differentiators.join('; ')}
Feature Additions: ${ideaEnhancement.featureAdditions.join('; ')}
Better Target Audiences: ${ideaEnhancement.betterTargetAudiences.join('; ')}
Pricing Strategy: ${ideaEnhancement.pricingStrategy}
Why it Wins: ${ideaEnhancement.whyItWins}`;
}

export function formatOpportunityScore(opportunityScore?: OpportunityScore | null): string {
  if (!opportunityScore) {
    return '';
  }

  return `Opportunity Score: ${opportunityScore.score}/100
Market Momentum: ${opportunityScore.breakdown.marketMomentum}
Audience Enthusiasm: ${opportunityScore.breakdown.audienceEnthusiasm}
Feasibility: ${opportunityScore.breakdown.feasibility}
Rationale: ${opportunityScore.rationale}`;
}

export function formatRiskRadar(riskRadar?: RiskRadar | null): string {
  if (!riskRadar) {
    return '';
  }

  const commentary = riskRadar.commentary?.length ? `Notes: ${riskRadar.commentary.join('; ')}` : '';

  return `Risk Radar (0=low risk, 100=critical):
Market: ${riskRadar.market}
Competition: ${riskRadar.competition}
Technical: ${riskRadar.technical}
Monetisation: ${riskRadar.monetisation}
Go-To-Market: ${riskRadar.goToMarket}
${commentary}`.trim();
}

export function formatPersonaReactions(
  personaReactions?: Partial<Record<ValidationSection, PersonaReaction[]>> | null,
  section?: ValidationSection
): string {
  if (!personaReactions) {
    return '';
  }

  const reactions = section ? personaReactions[section] : Object.values(personaReactions).flat();

  if (!reactions || reactions.length === 0) {
    return '';
  }

  return reactions
    .map((reaction) => {
      return `Persona: ${reaction.personaName}
Reaction: ${reaction.reaction}
Likes: ${reaction.likes.join('; ')}
Dislikes: ${reaction.dislikes.join('; ')}
Confusion: ${reaction.confusionPoints.join('; ')}
Requested Features: ${reaction.requestedFeatures.join('; ')}
`;
    })
    .join('\n');
}

