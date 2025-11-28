'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, TrendingUp } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: {
    strength: string;
    weakness: string;
    opportunity: string;
  } | null;
}

export function AIExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  if (!summary) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">AI Product Advisor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Run validation sections to receive an executive readout from your AI Product Advisor.
          </p>
        </CardContent>
      </Card>
    );
  }

  const summaryItems = [
    {
      label: "Biggest Strength",
      icon: Lightbulb,
      description: summary.strength,
      accent: "text-green-600",
    },
    {
      label: "Biggest Weakness",
      icon: Target,
      description: summary.weakness,
      accent: "text-red-600",
    },
    {
      label: "Biggest Opportunity",
      icon: TrendingUp,
      description: summary.opportunity,
      accent: "text-purple-600",
    },
  ];

  return (
    <Card className="border border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-purple-900">
          Your AI Product Advisor&apos;s Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-purple-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${item.accent}`} />
                <h3 className="text-sm font-semibold text-neutral-900">{item.label}</h3>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


