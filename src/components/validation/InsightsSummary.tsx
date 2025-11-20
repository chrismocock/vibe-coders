'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SectionData } from './useAllSectionsData';

interface InsightsSummaryProps {
  sections: SectionData[];
  averageScore: number;
  strongestSection: SectionData | null;
  weakestSection: SectionData | null;
  strongSections: number;
  weakSections: number;
}

export function InsightsSummary({
  sections,
  averageScore,
  strongestSection,
  weakestSection,
  strongSections,
  weakSections,
}: InsightsSummaryProps) {
  const completedSections = sections.filter((s) => s.isCompleted && s.result);

  if (completedSections.length === 0) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 text-center py-4">
            Complete validation sections to see insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Score */}
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
          <span className="text-sm font-medium text-neutral-700">Average Score</span>
          <span className="text-lg font-bold text-neutral-900">{averageScore}/100</span>
        </div>

        {/* Strongest Section */}
        {strongestSection && strongestSection.result && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-neutral-700">Strongest</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-neutral-900">{strongestSection.label}</span>
              <div className="text-xs text-green-600 font-medium">
                {strongestSection.result.score}/100
              </div>
            </div>
          </div>
        )}

        {/* Weakest Section */}
        {weakestSection && weakestSection.result && (
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-neutral-700">Needs Improvement</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-neutral-900">{weakestSection.label}</span>
              <div className="text-xs text-red-600 font-medium">
                {weakestSection.result.score}/100
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{strongSections}</div>
            <div className="text-xs text-neutral-600">Strong Sections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{weakSections}</div>
            <div className="text-xs text-neutral-600">Weak Sections</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

