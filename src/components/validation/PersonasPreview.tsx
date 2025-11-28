'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Persona } from '@/server/validation/types';

interface PersonasPreviewProps {
  personas: Persona[];
}

export function PersonasPreview({ personas }: PersonasPreviewProps) {
  if (!personas.length) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Persona Models</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Generate personas to see who the AI believes will adopt your product first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const preview = personas.slice(0, 3);

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Persona Models</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {preview.map((persona) => (
          <div key={persona.name} className="flex flex-col rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-neutral-900">{persona.name}</h3>
              <p className="text-sm text-neutral-600">
                {[
                  persona.age ? `${persona.age} yrs` : null,
                  persona.role,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
            {persona.goals?.length ? (
              <div className="mb-2">
                <Badge variant="outline" className="mb-1">
                  Goals
                </Badge>
                <p className="text-sm text-neutral-700 leading-relaxed">{persona.goals[0]}</p>
              </div>
            ) : null}
            {persona.pains?.length ? (
              <div className="mb-2">
                <Badge variant="outline" className="mb-1">
                  Pain
                </Badge>
                <p className="text-sm text-neutral-700 leading-relaxed">{persona.pains[0]}</p>
              </div>
            ) : null}
            {persona.neededFeatures?.length ? (
              <div className="mt-auto">
                <Badge variant="outline" className="mb-1">
                  Must-have Feature
                </Badge>
                <p className="text-sm text-neutral-700 leading-relaxed">{persona.neededFeatures[0]}</p>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


