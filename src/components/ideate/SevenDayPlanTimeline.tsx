import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SevenDayPlanTimeline({
  items,
}: {
  items: { day: string; label: string; detail: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>7-day plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.day} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {item.day}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </div>
            {idx < items.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
