'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskRadar } from '@/server/validation/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RiskRadarCardProps {
  risk: RiskRadar | null;
}

function riskClass(value: number) {
  if (value >= 70) return 'bg-red-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function RiskRadarCard({ risk }: RiskRadarCardProps) {
  if (!risk) {
    return (
      <Card className="border border-neutral-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Risk Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">Run validation to reveal risk hotspots across the product journey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">Risk Radar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: 'Market', value: risk.market },
          { label: 'Competition', value: risk.competition },
          { label: 'Technical', value: risk.technical },
          { label: 'Monetisation', value: risk.monetisation },
          { label: 'Go-To-Market', value: risk.goToMarket },
        ].map(({ label, value }) => {
          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">{label}</span>
                <span className="text-sm font-semibold text-neutral-900">{value}</span>
              </div>
              <Progress value={value} className={cn('h-2.5', riskClass(value))} />
            </div>
          );
        })}
        {risk.commentary?.length ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            {risk.commentary[0]}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


