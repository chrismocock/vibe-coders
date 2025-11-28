'use client';

import { SectionInsight } from '@/server/validation/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionInsightsGridProps {
  summary: string;
  insights?: SectionInsight;
}

const INSIGHT_ORDER: Array<{ key: keyof SectionInsight; label: string }> = [
  { key: 'discoveries', label: 'What We Discovered' },
  { key: 'meaning', label: 'What This Means' },
  { key: 'impact', label: 'Impact on Your Idea' },
  { key: 'recommendations', label: 'What Should Change' },
];

export function SectionInsightsGrid({ summary, insights }: SectionInsightsGridProps) {
  if (!insights) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {INSIGHT_ORDER.map(({ key, label }) => {
        const value = insights[key];
        if (!value) return null;

        return (
          <Card key={key} className="border border-neutral-200 bg-white">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


