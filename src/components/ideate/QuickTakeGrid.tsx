import { Card, CardContent } from "@/components/ui/card";

export function QuickTakeGrid({
  items,
}: {
  items: { label: string; value: string; delta?: string }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-dashed">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-semibold">{item.value}</p>
              {item.delta && (
                <span className="text-xs text-green-600">{item.delta}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
