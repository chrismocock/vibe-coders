import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PitchCard({
  title,
  summary,
  analysis,
  quickMetrics,
}: {
  title: string;
  summary?: string;
  analysis?: string;
  quickMetrics: { label: string; value: string; delta?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}

        {analysis && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="full-analysis">
              <AccordionTrigger className="text-sm font-medium">
                Full analysis (optional)
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {analysis}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

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
