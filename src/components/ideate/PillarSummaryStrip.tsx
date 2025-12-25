import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PillarSnapshot } from "@/lib/ideate/types";

export function PillarSummaryStrip({ pillars }: { pillars: PillarSnapshot[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {pillars.map((pillar) => {
        const isPositive = pillar.delta >= 0;
        return (
          <Card key={pillar.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{pillar.name}</p>
                <p className="text-2xl font-semibold">{pillar.score.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{pillar.summary}</p>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                  isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {isPositive ? "+" : ""}
                {pillar.delta.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
