'use client';

import { SectionDeepDive } from '@/server/validation/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DeepDiveInsightsPanelProps {
  deepDive?: SectionDeepDive;
}

export function DeepDiveInsightsPanel({ deepDive }: DeepDiveInsightsPanelProps) {
  if (!deepDive) return null;

  return (
    <Card className="border border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-900">Deepen Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-900 leading-relaxed">{deepDive.summary}</p>
        <InsightList label="Additional Signals" items={deepDive.signals} />
        <InsightList label="Research Findings" items={deepDive.researchFindings} />
        <InsightList label="Competitor Insights" items={deepDive.competitorInsights} />
        <InsightList label="Pricing Angles" items={deepDive.pricingAngles} />
        <InsightList label="Audience Angles" items={deepDive.audienceAngles} />
        <InsightList label="Feature Opportunities" items={deepDive.featureOpportunities} />
        <InsightList label="Next Steps" items={deepDive.nextSteps} />
      </CardContent>
    </Card>
  );
}

function InsightList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-blue-700">{label}</div>
      <ul className="mt-2 space-y-1 text-sm text-blue-900">
        {items.slice(0, 5).map((item, idx) => (
          <li key={idx} className="rounded-md border border-blue-100 bg-white px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


