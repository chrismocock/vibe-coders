'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, AlertCircle, Info, Users, TrendingUp, Wrench, DollarSign, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InitialFeedbackData {
  recommendation: 'build' | 'revise' | 'drop';
  overallConfidence: number;
  scores: {
    audienceFit: { score: number; rationale: string };
    competition: { score: number; rationale: string };
    marketDemand: { score: number; rationale: string };
    feasibility: { score: number; rationale: string };
    pricingPotential: { score: number; rationale: string };
  };
}

interface InitialFeedbackProps {
  feedback: InitialFeedbackData;
  previousScores?: Partial<InitialFeedbackData['scores']>;
  previousOverallConfidence?: number | null;
  scoreDeltas?: Partial<Record<string, ScoreDeltaInfo>>;
}

const scoreLabels: Record<string, string> = {
  audienceFit: 'Audience Fit',
  competition: 'Competition',
  marketDemand: 'Market Demand',
  feasibility: 'Feasibility',
  pricingPotential: 'Pricing Potential',
};

const dimensionDescriptions: Record<string, string> = {
  audienceFit: 'How well-defined and accessible is the target audience? Higher scores indicate a clear, reachable target market.',
  competition: 'How competitive is the market? Lower scores indicate more competition/challenges. Higher scores mean less competition or better differentiation.',
  marketDemand: 'How strong is the demand for this solution? Higher scores indicate stronger market demand.',
  feasibility: 'How realistic is it to build this with given resources? Higher scores indicate the idea is more feasible to execute.',
  pricingPotential: 'How likely are customers to pay for this? Higher scores indicate better monetization potential.',
};

export const dimensionIcons: Record<string, typeof Users> = {
  audienceFit: Users,
  competition: Target,
  marketDemand: TrendingUp,
  feasibility: Wrench,
  pricingPotential: DollarSign,
};

interface ScoreDeltaInfo {
  from: number | null;
  to: number;
  change: number | null;
}

export interface DimensionImpact {
  whatItMeasures: string;
  scoringFactors: string[];
  impactStatements: {
    high: string;    // 70-100
    medium: string;  // 40-69
    low: string;     // 0-39
  };
}

export const dimensionImpacts: Record<string, DimensionImpact> = {
  audienceFit: {
    whatItMeasures: 'How clearly you\'ve defined your target customers and how accessible they are to reach. This measures your Ideal Customer Profile (ICP) clarity, the urgency of their pain, and their willingness to pay.',
    scoringFactors: [
      'Ideal Customer Profile (ICP) clarity and specificity',
      'Problem urgency and pain intensity for the target audience',
      'Willingness to pay and budget availability',
      'Product-market fit potential',
      'User acquisition feasibility'
    ],
    impactStatements: {
      high: 'Your clear target audience means you can focus on reaching them effectively. You\'ll spend less time figuring out who your customers are and more time building features they want. This is a strong foundation for marketing and product development.',
      medium: 'Your audience needs more definition. Spend time creating detailed personas and understanding their specific pain points. This will help you build features they actually want and reach them through the right channels.',
      low: 'An unclear or inaccessible audience is a major risk. You need to identify who your customers are before building. Consider conducting customer interviews, analyzing competitors\' customers, or pivoting to a more defined market segment.'
    }
  },
  competition: {
    whatItMeasures: 'How competitive your market is and how well you differentiate from existing solutions. This evaluates direct competitors, indirect alternatives, and your unique positioning.',
    scoringFactors: [
      'Number and strength of direct competitors',
      'Market saturation level',
      'Your differentiation and unique value proposition',
      'Switching costs for customers',
      'Competitive advantages you can leverage'
    ],
    impactStatements: {
      high: 'Low competition or strong differentiation gives you room to grow. You can focus on building the best solution rather than constantly competing on price. This increases your chances of capturing market share.',
      medium: 'Moderate competition means you need to clearly communicate your unique value. Focus on what makes you different and consider targeting a specific niche where you can win before expanding.',
      low: 'High competition means you\'ll need strong differentiation to succeed. Focus on what makes you unique, consider targeting a niche where you can win, and be prepared for a longer sales cycle. You may need to pivot or find a blue ocean opportunity.'
    }
  },
  marketDemand: {
    whatItMeasures: 'How strong the demand is for your solution in the market. This evaluates market size, growth trends, urgency of need, and evidence that people actually want what you\'re building.',
    scoringFactors: [
      'Market size and growth potential',
      'Search trends and keyword demand',
      'Community discussions and interest signals',
      'Urgency of the problem being solved',
      'Willingness to pay and market readiness'
    ],
    impactStatements: {
      high: 'Strong demand signals suggest there\'s a real need for your solution. This increases your chances of finding early adopters and achieving product-market fit. You can focus on building and delivering value rather than creating demand.',
      medium: 'Moderate demand means you may need to educate the market or find early adopters who feel the pain most acutely. Consider focusing on a specific vertical or use case where demand is strongest.',
      low: 'Weak demand signals are a significant concern. You may need to validate that the problem is real and urgent. Consider pivoting to a problem with stronger demand signals, or focus on a niche where demand is concentrated.'
    }
  },
  feasibility: {
    whatItMeasures: 'How realistic it is to build your idea with available resources, tools, and timeline. This evaluates technical complexity, resource requirements, and implementation challenges.',
    scoringFactors: [
      'Technical complexity and build difficulty',
      'Resource requirements (time, money, skills)',
      'Dependencies and potential blockers',
      'MVP scope and timeline',
      'Available tools and technologies'
    ],
    impactStatements: {
      high: 'High feasibility means you can move quickly and focus on execution. You can build an MVP relatively easily and start validating with real users. This reduces risk and allows for faster iteration.',
      medium: 'Moderate feasibility means you should prioritize carefully. Focus on building an MVP with core features only, consider using no-code tools, and be realistic about timelines. You may need to simplify your initial vision.',
      low: 'Build complexity concerns mean you should seriously reconsider your approach. Consider using no-code tools, partnering with technical co-founders, or significantly simplifying your MVP. You may need to pivot to a more feasible solution or acquire the necessary resources first.'
    }
  },
  pricingPotential: {
    whatItMeasures: 'How likely customers are to pay for your solution and how much revenue potential exists. This evaluates monetization models, pricing leverage, and customer willingness to pay.',
    scoringFactors: [
      'Revenue model clarity and viability',
      'Customer willingness to pay',
      'Pricing leverage and premium potential',
      'Market pricing benchmarks',
      'Long-term revenue sustainability'
    ],
    impactStatements: {
      high: 'Good monetization potential means customers are likely to pay for your solution. Focus on pricing experiments, value communication, and optimizing your revenue model. This increases your chances of building a sustainable business.',
      medium: 'Moderate pricing potential means you need to carefully test pricing and value propositions. Consider different monetization models, focus on demonstrating clear ROI, and be prepared to iterate on pricing based on customer feedback.',
      low: 'Limited pricing potential is a major concern for sustainability. You may need to pivot to a different monetization model, target customers with higher willingness to pay, or find ways to significantly increase the value you deliver. Consider whether this idea can support a viable business.'
    }
  },
};

interface ScoreRange {
  range: string;
  label: string;
  description: string;
  color: string;
}

const scoreRangeDescriptions: Record<string, ScoreRange[]> = {
  audienceFit: [
    { range: '80-100', label: 'Excellent', description: 'Clear, well-defined target audience that\'s highly accessible', color: 'text-green-600' },
    { range: '70-79', label: 'Good', description: 'Well-defined audience with good accessibility', color: 'text-green-600' },
    { range: '60-69', label: 'Moderate', description: 'Audience is somewhat defined but may need refinement', color: 'text-yellow-600' },
    { range: '40-59', label: 'Needs Improvement', description: 'Audience is vague or hard to reach', color: 'text-yellow-600' },
    { range: '0-39', label: 'Weak', description: 'Unclear or inaccessible target audience', color: 'text-red-600' },
  ],
  competition: [
    { range: '80-100', label: 'Excellent', description: 'Low competition or strong differentiation, clear competitive advantage', color: 'text-green-600' },
    { range: '70-79', label: 'Good', description: 'Moderate competition with good differentiation opportunities', color: 'text-green-600' },
    { range: '60-69', label: 'Moderate', description: 'Some competition, limited differentiation', color: 'text-yellow-600' },
    { range: '40-59', label: 'Needs Improvement', description: 'High competition, weak differentiation', color: 'text-yellow-600' },
    { range: '0-39', label: 'Weak', description: 'Saturated market, no clear competitive advantage', color: 'text-red-600' },
  ],
  marketDemand: [
    { range: '80-100', label: 'Excellent', description: 'Very strong demand, clear market need', color: 'text-green-600' },
    { range: '70-79', label: 'Good', description: 'Strong demand exists', color: 'text-green-600' },
    { range: '60-69', label: 'Moderate', description: 'Moderate demand, may need market education', color: 'text-yellow-600' },
    { range: '40-59', label: 'Needs Improvement', description: 'Weak demand signals', color: 'text-yellow-600' },
    { range: '0-39', label: 'Weak', description: 'Very weak or unclear demand', color: 'text-red-600' },
  ],
  feasibility: [
    { range: '80-100', label: 'Excellent', description: 'Highly feasible with available resources', color: 'text-green-600' },
    { range: '70-79', label: 'Good', description: 'Feasible with minor challenges', color: 'text-green-600' },
    { range: '60-69', label: 'Moderate', description: 'Somewhat feasible but may face obstacles', color: 'text-yellow-600' },
    { range: '40-59', label: 'Needs Improvement', description: 'Significant feasibility concerns', color: 'text-yellow-600' },
    { range: '0-39', label: 'Weak', description: 'Very difficult or unrealistic to build', color: 'text-red-600' },
  ],
  pricingPotential: [
    { range: '80-100', label: 'Excellent', description: 'High likelihood customers will pay premium prices', color: 'text-green-600' },
    { range: '70-79', label: 'Good', description: 'Good monetization potential', color: 'text-green-600' },
    { range: '60-69', label: 'Moderate', description: 'Moderate pricing potential', color: 'text-yellow-600' },
    { range: '40-59', label: 'Needs Improvement', description: 'Limited pricing potential', color: 'text-yellow-600' },
    { range: '0-39', label: 'Weak', description: 'Very low likelihood customers will pay', color: 'text-red-600' },
  ],
};

const recommendationConfig = {
  build: {
    label: 'Build',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Strong validation across all dimensions. Proceed with confidence!',
  },
  revise: {
    label: 'Revise',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Good opportunity to refine your idea, based on refinement before building.',
  },
  drop: {
    label: 'Drop',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Significant concerns identified. Consider pivoting or exploring alternatives.',
  },
};

export const getImpactBadge = (score: number) => {
  if (score >= 70) return { label: 'Strong Foundation', color: 'bg-green-100 text-green-700 border-green-200' };
  if (score >= 40) return { label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: 'Critical Gap', color: 'bg-red-100 text-red-700 border-red-200' };
};

export const getImpactStatement = (dimension: string, score: number): string => {
  const impact = dimensionImpacts[dimension];
  if (!impact) return '';
  
  if (score >= 70) return impact.impactStatements.high;
  if (score >= 40) return impact.impactStatements.medium;
  return impact.impactStatements.low;
};

export function InitialFeedback({
  feedback,
  previousScores,
  previousOverallConfidence,
  scoreDeltas,
}: InitialFeedbackProps) {
  const recConfig = recommendationConfig[feedback.recommendation];
  const RecIcon = recConfig.icon;
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Strong';
    if (score >= 40) return 'Moderate';
    return 'Weak';
  };

  const toggleDimension = (dimension: string) => {
    const newExpanded = new Set(expandedDimensions);
    if (newExpanded.has(dimension)) {
      newExpanded.delete(dimension);
    } else {
      newExpanded.add(dimension);
    }
    setExpandedDimensions(newExpanded);
  };

  const getScoreRangeForDimension = (dimension: string, score: number): ScoreRange | null => {
    const ranges = scoreRangeDescriptions[dimension];
    if (!ranges) return null;

    // Find the range that matches the score
    for (const range of ranges) {
      const [min, max] = range.range.split('-').map(Number);
      if (score >= min && score <= max) {
        return range;
      }
    }
    return null;
  };

  const resolveDelta = (key: string, previousValue?: number | null): number | null => {
    const deltaInfo = scoreDeltas?.[key];
    if (deltaInfo && typeof deltaInfo.change === 'number' && deltaInfo.change !== 0) {
      return deltaInfo.change;
    }
    if (typeof previousValue === 'number') {
      const nextValue =
        key === 'overallConfidence'
          ? feedback.overallConfidence
          : feedback.scores[key as keyof typeof feedback.scores]?.score;
      if (typeof nextValue === 'number') {
        const delta = nextValue - previousValue;
        return delta !== 0 ? delta : null;
      }
    }
    return null;
  };

  const renderDeltaChip = (delta: number | null) => {
    if (typeof delta !== 'number' || delta === 0) return null;
    const value = Math.round(delta);
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border',
          value > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200',
        )}
      >
        {value > 0 ? '+' : ''}
        {value} pts
      </span>
    );
  };

  const overallDelta = resolveDelta('overallConfidence', previousOverallConfidence ?? null);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-900">Initial Feedback</h2>
          <p className="text-sm text-neutral-600">
            Quick validation results to help you refine your idea before proceeding to full validation.
          </p>
        </div>

      {/* Recommendation Card */}
      <Card className={cn('border-2', recConfig.borderColor, recConfig.bgColor)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <RecIcon className={cn('h-6 w-6 mt-0.5', recConfig.color)} />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Recommendation: {recConfig.label}
              </CardTitle>
              <CardDescription className="text-neutral-700 mt-1">
                {recConfig.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Confidence */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Overall Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Confidence Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-neutral-900">{feedback.overallConfidence}%</span>
                {renderDeltaChip(overallDelta)}
              </div>
            </div>
            <Progress value={feedback.overallConfidence} className="h-3" />
          </div>
        </CardContent>
      </Card>

        {/* Initial Assessment */}
        <Card className="border border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">Initial Assessment</CardTitle>
            <CardDescription className="text-neutral-600">
              Your idea evaluated across five key validation dimensions. Each dimension is scored from 0-100, with higher scores indicating stronger validation. Click &ldquo;Learn more&rdquo; or hover over the info icons to see what each dimension measures, how it is scored, and what it means for your idea.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(feedback.scores).map(([key, scoreData]) => {
              const scoreRange = getScoreRangeForDimension(key, scoreData.score);
              const DimensionIcon = dimensionIcons[key] || Info;
              const impact = dimensionImpacts[key];
              const impactBadge = getImpactBadge(scoreData.score);
              const impactStatement = getImpactStatement(key, scoreData.score);
              const isExpanded = expandedDimensions.has(key);
              const previousScoreValue =
                previousScores && (previousScores as Record<string, { score?: number }>)[key]?.score;
              const pillarDelta = resolveDelta(
                key,
                typeof previousScoreValue === 'number' ? previousScoreValue : undefined,
              );

              return (
              <div key={key} className="space-y-3 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <DimensionIcon className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-neutral-900">
                          {scoreLabels[key] || key}
                        </span>
                        {scoreRange && (
                          <>
                            <span className="text-sm text-neutral-500">—</span>
                            <span className={cn('text-sm font-medium', scoreRange.color)}>
                              {scoreRange.label}
                            </span>
                          </>
                        )}
                        <span className={cn('text-xs px-2 py-0.5 rounded font-medium border', impactBadge.color)}>
                          {impactBadge.label}
                        </span>
                      </div>
                      {impact && (
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {impact.whatItMeasures}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                          aria-label={`Learn more about ${scoreLabels[key] || key}`}
                        >
                          <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-md bg-neutral-900 text-neutral-50 border-neutral-700 p-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold mb-1.5 text-neutral-300 uppercase tracking-wide">
                              What This Measures
                            </p>
                            <p className="text-sm leading-relaxed">
                              {impact?.whatItMeasures || dimensionDescriptions[key] || 'No description available.'}
                            </p>
                          </div>
                          {impact && (
                            <div className="border-t border-neutral-700 pt-3">
                              <p className="text-xs font-semibold mb-2 text-neutral-300 uppercase tracking-wide">
                                Scoring Factors
                              </p>
                              <ul className="space-y-1.5">
                                {impact.scoringFactors.map((factor, idx) => (
                                  <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                                    <span className="text-neutral-500 mt-1">•</span>
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="border-t border-neutral-700 pt-3">
                            <p className="text-xs font-semibold mb-2 text-neutral-300 uppercase tracking-wide">
                              Score Ranges
                            </p>
                            <div className="space-y-2">
                              {scoreRangeDescriptions[key]?.map((range, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex items-start gap-2">
                                    <span className={cn('font-semibold min-w-[60px]', range.color)}>
                                      {range.range}%
                                    </span>
                                    <div className="flex-1">
                                      <span className={cn('font-medium', range.color)}>
                                        {range.label}
                                      </span>
                                      <span className="text-neutral-400 ml-1">— {range.description}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {impactStatement && (
                            <div className="border-t border-neutral-700 pt-3">
                              <p className="text-xs font-semibold mb-1.5 text-neutral-300 uppercase tracking-wide">
                                Impact on Your Idea
                              </p>
                              <p className="text-xs text-neutral-300 leading-relaxed">
                                {impactStatement}
                              </p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          scoreData.score >= 70
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : scoreData.score >= 40
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-red-100 text-red-700 border border-red-200',
                        )}
                      >
                        {getScoreLabel(scoreData.score)} {scoreData.score}%
                      </span>
                      {renderDeltaChip(pillarDelta)}
                    </div>
                  </div>
                </div>
                <Progress value={scoreData.score} className={cn('h-2.5', getScoreColor(scoreData.score))} />
                
                {/* Impact Statement - "So What?" */}
                {impactStatement && (
                  <div className={cn(
                    'rounded-md p-3 border-l-4',
                    scoreData.score >= 70
                      ? 'bg-green-50 border-green-400'
                      : scoreData.score >= 40
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-red-50 border-red-400'
                  )}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className={cn(
                        'h-4 w-4 mt-0.5 flex-shrink-0',
                        scoreData.score >= 70
                          ? 'text-green-600'
                          : scoreData.score >= 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold mb-1 text-neutral-900">
                          So What? What This Means for Your Idea:
                        </p>
                        <p className="text-xs text-neutral-700 leading-relaxed">
                          {impactStatement}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable "Learn More" Section */}
                {impact && (
                  <div className="border-t border-neutral-200 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleDimension(key)}
                      className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors w-full"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      <span>Learn more about this dimension</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-3 pl-6">
                        <div>
                          <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                            What This Measures
                          </p>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {impact.whatItMeasures}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                            Scoring Factors
                          </p>
                          <ul className="space-y-1">
                            {impact.scoringFactors.map((factor, idx) => (
                              <li key={idx} className="text-xs text-neutral-600 flex items-start gap-2">
                                <span className="text-neutral-400 mt-1">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                            Current Score Impact
                          </p>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {impactStatement}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scoreData.rationale && (
                  <div className="border-t border-neutral-200 pt-2.5">
                    <p className="text-xs font-semibold text-neutral-700 mb-1">Analysis</p>
                    <p className="text-xs text-neutral-600 leading-relaxed">{scoreData.rationale}</p>
                  </div>
                )}
              </div>
            );
            })}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

