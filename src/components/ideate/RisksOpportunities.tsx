import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lightbulb } from "lucide-react";

export function RisksOpportunities({
  risks,
  opportunities,
}: {
  risks: string[];
  opportunities: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Risks & Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <ListBlock icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} title="Risks" items={risks} />
        <ListBlock icon={<Lightbulb className="h-4 w-4 text-green-500" />} title="Opportunities" items={opportunities} />
      </CardContent>
    </Card>
  );
}

function ListBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-md border bg-muted/40 p-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
