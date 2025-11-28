'use client';

import { SectionSuggestions } from '@/server/validation/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AISuggestionsPanelProps {
  suggestions?: SectionSuggestions;
}

const SUGGESTION_SECTIONS: Array<{ key: keyof SectionSuggestions; label: string }> = [
  { key: 'features', label: 'Feature Suggestions' },
  { key: 'positioning', label: 'Positioning Moves' },
  { key: 'audience', label: 'Audience Plays' },
  { key: 'copy', label: 'Suggested Messaging' },
];

export function AISuggestionsPanel({ suggestions }: AISuggestionsPanelProps) {
  if (!suggestions || !Object.values(suggestions).some((list) => list && list.length > 0)) {
    return null;
  }

  return (
    <Card className="border border-purple-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SUGGESTION_SECTIONS.map(({ key, label }) => {
          const items = suggestions[key];
          if (!items || items.length === 0) return null;

          return (
            <div key={key}>
              <div className="text-xs font-medium uppercase tracking-wide text-purple-600">{label}</div>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                {items.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="rounded-md border border-purple-100 bg-purple-50 px-3 py-2">
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


