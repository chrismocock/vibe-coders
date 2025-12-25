import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const entries = [
  {
    title: "Added guided onboarding presets",
    by: "Nina",
    time: "1h ago",
    tag: "Applied",
  },
  {
    title: "Updated competitive positioning for automations",
    by: "Kai",
    time: "4h ago",
    tag: "Ideate",
  },
];

export function ChangeLogTimeline() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Change log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry, idx) => (
          <div key={entry.title} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{entry.title}</p>
              <Badge variant="secondary">{entry.tag}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.by} • {entry.time}
            </p>
            {idx < entries.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
