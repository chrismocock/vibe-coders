import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Rocket, Wand2 } from "lucide-react";
import { Suggestion } from "@/app/project/[id]/ideate/page";

export function BestImprovementsList({
  items,
  onApply,
  onGenerate,
}: {
  items: Suggestion[];
  onApply: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Recommendations</p>
          <CardTitle>Best improvements</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={onGenerate}>
          <Wand2 className="mr-2 h-4 w-4" /> Generate
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <Badge variant="secondary">{item.impact} impact</Badge>
                <Badge variant="outline">{item.effort} effort</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.applied ? (
                <Badge className="bg-green-600 text-white" variant="secondary">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied
                </Badge>
              ) : (
                <Button size="sm" onClick={() => onApply(item.id)}>
                  <Rocket className="mr-2 h-4 w-4" /> Apply
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
