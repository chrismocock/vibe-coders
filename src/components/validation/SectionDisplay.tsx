'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionResult } from '@/server/validation/types';
import { toast } from 'sonner';

interface SectionDisplayProps {
  section: string;
  sectionLabel: string;
  data: SectionResult | null;
  isLoading?: boolean;
  onRerun: () => Promise<void>;
  projectId: string;
}

export function SectionDisplay({
  section,
  sectionLabel,
  data,
  isLoading = false,
  onRerun,
  projectId,
}: SectionDisplayProps) {
  const [isRerunning, setIsRerunning] = useState(false);

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

  const getScoreBadgeVariant = (score: number) => {
    return 'outline';
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
              variant={getScoreBadgeVariant(data.score)}
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
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Recommended Validation Actions</CardTitle>
          <CardDescription className="text-neutral-600">
            Actionable steps to validate and improve this aspect of your idea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-neutral-700 leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Re-run Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRerun}
          disabled={isRerunning}
          variant="outline"
          className="flex items-center gap-2"
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
      </div>
    </div>
  );
}

