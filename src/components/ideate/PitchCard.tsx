import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PitchCard({
  title,
  narrative,
  quickMetrics,
}: {
  title: string;
  narrative: string;
  quickMetrics: { label: string; value: string; delta?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {narrative}
        </p>
        <div className="flex flex-wrap gap-2">
          {quickMetrics.map((metric) => (
            <Badge key={metric.label} variant="secondary" className="gap-1">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{metric.value}</span>
              {metric.delta && (
                <span className="text-xs text-green-600">{metric.delta}</span>
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
