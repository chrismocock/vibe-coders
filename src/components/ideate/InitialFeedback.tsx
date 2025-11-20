'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
}

const scoreLabels: Record<string, string> = {
  audienceFit: 'Audience Fit',
  competition: 'Competition',
  marketDemand: 'Market Demand',
  feasibility: 'Feasibility',
  pricingPotential: 'Pricing Potential',
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

export function InitialFeedback({ feedback }: InitialFeedbackProps) {
  const recConfig = recommendationConfig[feedback.recommendation];
  const RecIcon = recConfig.icon;

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

  return (
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
              <span className="text-2xl font-bold text-neutral-900">{feedback.overallConfidence}%</span>
            </div>
            <Progress value={feedback.overallConfidence} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Validation Scores */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Validation Scores</CardTitle>
          <CardDescription className="text-neutral-600">
            Detailed analysis across five key dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(feedback.scores).map(([key, scoreData]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  {scoreLabels[key] || key}
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    scoreData.score >= 70
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : scoreData.score >= 40
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  )}>
                    {getScoreLabel(scoreData.score)} {scoreData.score}%
                  </span>
                </div>
              </div>
              <Progress value={scoreData.score} className={cn('h-2', getScoreColor(scoreData.score))} />
              {scoreData.rationale && (
                <p className="text-xs text-neutral-600 mt-1 pl-1">{scoreData.rationale}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

