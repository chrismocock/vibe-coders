'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { IdeaEnhancement } from '@/server/validation/types';

interface IdeaEnhancerPreviewProps {
  enhancement: IdeaEnhancement | null;
  projectId: string;
  reportId?: string;
  onRefresh: () => Promise<void>;
}

export function IdeaEnhancerPreview({ enhancement, projectId, reportId, onRefresh }: IdeaEnhancerPreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleImprove = async () => {
    if (!reportId) {
      toast.error('Validation report not found yet.');
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await fetch('/api/validation/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reportId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to improve idea');
      }

      await onRefresh();
      toast.success('Idea enhancer refreshed with new angles.');
    } catch (error) {
      console.error('Idea enhancer error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to improve idea');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!enhancement) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Idea Enhancer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Ask the Idea Enhancer to sharpen positioning, differentiators, and go-to-market angles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Idea Enhancer Outlook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleImprove}
          disabled={isRefreshing || !reportId}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Improve My Idea
        </Button>

        <KeyInsight label="Stronger Positioning" content={enhancement.strongerPositioning} />
        <KeyInsight label="Unique Angle" content={enhancement.uniqueAngle} />
        <InsightList label="Differentiators" items={enhancement.differentiators} />
        <InsightList label="Feature Additions" items={enhancement.featureAdditions} />
        <InsightList label="Better Target Audiences" items={enhancement.betterTargetAudiences} />
        <KeyInsight label="Pricing Strategy" content={enhancement.pricingStrategy} />
        <KeyInsight label="Why This Wins" content={enhancement.whyItWins} />
      </CardContent>
    </Card>
  );
}

function KeyInsight({ label, content }: { label: string; content: string }) {
  if (!content) return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <p className="mt-1 text-sm text-neutral-700 leading-relaxed">{content}</p>
    </div>
  );
}

function InsightList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <ul className="mt-1 space-y-1 text-sm text-neutral-700">
        {items.slice(0, 4).map((item, idx) => (
          <li key={idx} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


