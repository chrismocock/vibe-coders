'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, Loader2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionResult, PersonaReaction } from '@/server/validation/types';
import { toast } from 'sonner';
import { getNextStep } from './sectionNavigation';
import { SectionInsightsGrid } from './SectionInsightsGrid';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { PersonaReactionsPanel } from './PersonaReactionsPanel';
import { DeepDiveInsightsPanel } from './DeepDiveInsightsPanel';

interface SectionDisplayProps {
  section: string;
  sectionLabel: string;
  data: SectionResult | null;
  completedActions?: string[];
  isLoading?: boolean;
  onRerun: () => Promise<void>;
  onToggleAction?: (actionText: string, completed: boolean) => Promise<void>;
  onDeepenAnalysis: () => Promise<void>;
  personaReactions: PersonaReaction[];
  onRefreshPersonaReactions: () => Promise<void>;
  projectId: string;
}

export function SectionDisplay({
  section,
  sectionLabel,
  data,
  completedActions = [],
  isLoading = false,
  onRerun,
  onToggleAction,
  onDeepenAnalysis,
  personaReactions,
  onRefreshPersonaReactions,
  projectId,
}: SectionDisplayProps) {
  const [isRerunning, setIsRerunning] = useState(false);
  const [togglingActions, setTogglingActions] = useState<Set<string>>(new Set());
  const [isDeepening, setIsDeepening] = useState(false);

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

  const handleRerun = async () => {
    try {
      setIsRerunning(true);
      await onRerun();
      toast.success(`${sectionLabel} section updated successfully`);
    } catch (error) {
      console.error('Error rerunning section:', error);
      toast.error(`Failed to update ${sectionLabel} section`);
    } finally {
      setIsRerunning(false);
    }
  };

  const handleDeepen = async () => {
    try {
      setIsDeepening(true);
      await onDeepenAnalysis();
      toast.success(`Deeper analysis generated for ${sectionLabel}`);
    } catch (error) {
      console.error('Error deepening analysis:', error);
      toast.error(`Failed to deepen ${sectionLabel} insights`);
    } finally {
      setIsDeepening(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-600">Loading {sectionLabel}...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-900">{sectionLabel}</CardTitle>
          <CardDescription className="text-neutral-600">
            No validation data available yet. Run this section to get insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRerun} disabled={isRerunning} className="w-full sm:w-auto">
            {isRerunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run {sectionLabel}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-neutral-900">{sectionLabel}</CardTitle>
              <CardDescription className="text-neutral-600 mt-1">
                Validation score and insights
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-sm font-semibold',
                data.score >= 70
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : data.score >= 40
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              {getScoreLabel(data.score)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Score</span>
              <span className="text-2xl font-bold text-neutral-900">{data.score}/100</span>
            </div>
            <Progress value={data.score} className={cn('h-3', getScoreColor(data.score))} />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <SectionInsightsGrid summary={data.summary} insights={data.insightBreakdown} />

      <AISuggestionsPanel suggestions={data.suggestions} />

      {/* Actions Card */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">Recommended Validation Actions</CardTitle>
              <CardDescription className="text-neutral-600">
                Actionable steps to validate and improve this aspect of your idea
              </CardDescription>
            </div>
            {data.actions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {completedActions.length} / {data.actions.length} completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.actions.map((action, index) => {
              const isCompleted = completedActions.includes(action);
              const isToggling = togglingActions.has(action);

              return (
                <li 
                  key={index} 
                  className={cn(
                    "flex items-start gap-3 transition-all",
                    isCompleted && "opacity-75"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!onToggleAction || isToggling) return;
                      setTogglingActions((prev) => new Set(prev).add(action));
                      onToggleAction(action, !isCompleted)
                        .catch(() => {
                          // Error already handled in hook
                        })
                        .finally(() => {
                          setTogglingActions((prev) => {
                            const next = new Set(prev);
                            next.delete(action);
                            return next;
                          });
                        });
                    }}
                    disabled={isToggling || !onToggleAction}
                    className={cn(
                      "mt-0.5 flex-shrink-0 transition-all",
                      "hover:scale-110",
                      isToggling && "opacity-50 cursor-wait",
                      !onToggleAction && "cursor-not-allowed"
                    )}
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isToggling ? (
                      <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                  <span 
                    className={cn(
                      "text-sm leading-relaxed flex-1",
                      isCompleted 
                        ? "text-neutral-500 line-through" 
                        : "text-neutral-700"
                    )}
                  >
                    {action}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <PersonaReactionsPanel reactions={personaReactions} onRefresh={onRefreshPersonaReactions} />

      <DeepDiveInsightsPanel deepDive={data.deepDive} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        {/* Deepen Analysis Button */}
        <Button
          onClick={handleDeepen}
          disabled={isDeepening}
          className="flex items-center gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isDeepening ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deepening...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Deepen Analysis
            </>
          )}
        </Button>

        {/* Refresh Button */}
        <Button
          onClick={handleRerun}
          disabled={isRerunning}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          {isRerunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Re-run {sectionLabel}
            </>
          )}
        </Button>

        {/* Next Step Button */}
        {(() => {
          const nextStep = getNextStep(section);
          if (!nextStep || !data) return null;

          return (
            <Link href={`/project/${projectId}/validate/${nextStep.nextSection}`}>
              <Button
                className="flex items-center gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                <span>Next: {nextStep.nextLabel}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="hidden lg:inline ml-1 text-sm opacity-90">
                  → {nextStep.description}
                </span>
              </Button>
            </Link>
          );
        })()}
      </div>
    </div>
  );
}

