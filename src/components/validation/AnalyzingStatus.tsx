'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyzingStatusProps {
  status?: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: number;
}

const agents = [
  { id: 'market-demand', label: 'Market Demand' },
  { id: 'competition', label: 'Competition' },
  { id: 'audience-fit', label: 'Audience Fit' },
  { id: 'feasibility', label: 'Feasibility' },
  { id: 'pricing-potential', label: 'Pricing Potential' },
];

export function AnalyzingStatus({ status = 'running', progress = 0 }: AnalyzingStatusProps) {
  const isComplete = status === 'succeeded';
  const isFailed = status === 'failed';
  
  // Estimate progress based on status
  const displayProgress = isComplete ? 100 : isFailed ? 0 : Math.max(progress, 20);

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Analysis Complete
            </>
          ) : isFailed ? (
            'Analysis Failed'
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Analyzing Your Idea
            </>
          )}
        </CardTitle>
        <CardDescription className="text-neutral-600">
          {isComplete
            ? 'Your validation report is ready!'
            : isFailed
            ? 'An error occurred during validation. Please try again.'
            : 'Our AI agents are evaluating your idea across multiple dimensions...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Overall Progress</span>
            <span className="font-medium text-neutral-900">{displayProgress}%</span>
          </div>
          <Progress value={displayProgress} className="h-3" />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700">Validation Agents</h3>
          <div className="space-y-2">
            {agents.map((agent, index) => {
              const agentProgress = isComplete
                ? 100
                : Math.min(100, ((index + 1) / agents.length) * displayProgress);
              const isAgentComplete = agentProgress >= 100;

              return (
                <div key={agent.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0',
                      isAgentComplete
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                    )}
                  >
                    {isAgentComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-900">{agent.label}</span>
                      {isAgentComplete && (
                        <span className="text-xs text-green-600">Complete</span>
                      )}
                    </div>
                    <Progress value={agentProgress} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isComplete && !isFailed && (
          <p className="text-xs text-neutral-500 text-center pt-2">
            This may take 30-60 seconds. Please don't close this page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

