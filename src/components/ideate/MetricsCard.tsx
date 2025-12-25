import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MetricsCard({
  title,
  value,
  badge,
}: {
  title: string;
  value: string;
  badge?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">{value}</p>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </CardContent>
    </Card>
  );
}
