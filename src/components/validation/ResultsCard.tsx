'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationReport {
  id: string;
  idea_title: string;
  idea_summary?: string;
  scores: {
    marketDemand: number;
    competition: number;
    audienceFit: number;
    feasibility: number;
    pricingPotential: number;
  };
  overall_confidence: number;
  recommendation: 'build' | 'revise' | 'drop';
  rationales?: Record<string, string>;
  agent_details?: Record<string, { signals?: string[] }>;
  created_at: string;
}

interface ResultsCardProps {
  report: ValidationReport;
}

const scoreLabels: Record<string, string> = {
  marketDemand: 'Market Demand',
  competition: 'Competition',
  audienceFit: 'Audience Fit',
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
    description: 'Good potential, but some areas need refinement before building.',
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

export function ResultsCard({ report }: ResultsCardProps) {
  const recConfig = recommendationConfig[report.recommendation];
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
      {/* Overall Recommendation */}
      <Card className={cn('border-2', recConfig.borderColor, recConfig.bgColor)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <RecIcon className={cn('h-6 w-6 mt-0.5', recConfig.color)} />
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-neutral-900">
                Recommendation: {recConfig.label}
              </CardTitle>
              <CardDescription className="text-neutral-700 mt-1">
                {recConfig.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Overall Confidence</span>
              <span className="text-2xl font-bold text-neutral-900">{report.overall_confidence}%</span>
            </div>
            <Progress value={report.overall_confidence} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Validation Scores</CardTitle>
          <CardDescription className="text-neutral-600">
            Detailed analysis across five key dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(report.scores).map(([key, score]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  {scoreLabels[key] || key}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      score >= 70
                        ? 'border-green-300 text-green-700 bg-green-50'
                        : score >= 40
                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                        : 'border-red-300 text-red-700 bg-red-50'
                    )}
                  >
                    {getScoreLabel(score)}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-900 w-12 text-right">
                    {score}%
                  </span>
                </div>
              </div>
              <Progress value={score} className={cn('h-2', getScoreColor(score))} />
              {report.rationales?.[key] && (
                <p className="text-xs text-neutral-600 mt-1 pl-1">{report.rationales[key]}</p>
              )}
              {report.agent_details?.[key]?.signals && report.agent_details[key].signals!.length > 0 && (
                <ul className="text-xs text-neutral-500 mt-2 pl-4 list-disc space-y-0.5">
                  {report.agent_details[key].signals!.map((signal, idx) => (
                    <li key={idx}>{signal}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

