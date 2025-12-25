import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Suggestion, PillarSnapshot } from "@/app/project/[id]/ideate/page";
import { Rocket, Wand2 } from "lucide-react";

export function PillarAccordion({
  pillars,
  suggestions,
  onApply,
  onGenerate,
}: {
  pillars: PillarSnapshot[];
  suggestions: Suggestion[];
  onApply: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <Accordion type="multiple" className="w-full">
      {pillars.map((pillar) => {
        const pillarSuggestions = suggestions.filter(
          (item) => item.pillarId === pillar.id
        );
        return (
          <AccordionItem key={pillar.id} value={pillar.id}>
            <AccordionTrigger>
              <div className="flex flex-col items-start gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{pillar.name}</span>
                  <Badge variant="outline">{pillar.score.toFixed(1)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{pillar.summary}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 rounded-b-lg border-t bg-muted/40 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ListBlock title="Opportunities" items={pillar.opportunities} />
                <ListBlock title="Risks" items={pillar.risks} subtle />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Moves to make next</p>
                <Button variant="outline" size="sm" onClick={onGenerate}>
                  <Wand2 className="mr-2 h-4 w-4" /> Generate
                </Button>
              </div>

              <div className="space-y-2">
                {pillarSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex flex-col gap-2 rounded-lg border bg-background p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {suggestion.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{suggestion.impact} impact</Badge>
                        <Badge variant="outline">{suggestion.effort} effort</Badge>
                      </div>
                    </div>
                    {suggestion.applied ? (
                      <Badge className="bg-green-600 text-white" variant="secondary">
                        Applied
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => onApply(suggestion.id)}>
                        <Rocket className="mr-2 h-4 w-4" /> Apply
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function ListBlock({
  title,
  items,
  subtle,
}: {
  title: string;
  items: string[];
  subtle?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-md border p-3 ${subtle ? "bg-muted/30" : "bg-background"}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
