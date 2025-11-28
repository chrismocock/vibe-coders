'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureMap } from '@/server/validation/types';

interface FeatureOpportunityPreviewProps {
  featureMap: FeatureMap | null;
}

const CATEGORIES: Array<{ key: keyof FeatureMap; label: string; description: string }> = [
  { key: 'must', label: 'Must-Have', description: 'Core features required for launch' },
  { key: 'should', label: 'Should-Have', description: 'High leverage enhancements' },
  { key: 'could', label: 'Could-Have', description: 'Delighters for later iterations' },
  { key: 'avoid', label: 'Avoid', description: 'Risky or low-value ideas to skip' },
];

export function FeatureOpportunityPreview({ featureMap }: FeatureOpportunityPreviewProps) {
  if (!featureMap) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Feature Opportunity Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Generate the feature opportunity map to see what your AI co-founder prioritises.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Feature Opportunity Map</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {CATEGORIES.map(({ key, label, description }) => {
          const items = featureMap[key];
          if (!items?.length) return null;

          return (
            <div key={key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
              <p className="mb-3 text-xs text-neutral-500 uppercase tracking-wide">{description}</p>
              <ul className="space-y-2 text-sm text-neutral-700">
                {items.slice(0, 4).map((item, idx) => (
                  <li key={idx} className="rounded-md bg-white px-3 py-2 border border-neutral-200 shadow-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


