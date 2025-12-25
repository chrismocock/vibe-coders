import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, PlayCircle, Send } from "lucide-react";

export function IdeateHeader({
  projectId,
  headline,
  summary,
  onRunIdeate,
  onPushValidate,
  isRunning,
  hasPushed,
}: {
  projectId?: string;
  headline: string;
  summary: string;
  onRunIdeate: () => void;
  onPushValidate: () => void;
  isRunning: boolean;
  hasPushed: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Project {projectId ?? ""}</Badge>
            <span>Ideate</span>
          </div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground">
            {headline}
          </h1>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onPushValidate}
            className={cn(hasPushed && "border-green-500 text-green-700")}
          >
            <Send className="mr-2 h-4 w-4" />
            {hasPushed ? "Pushed to Validate" : "Push to Validate"}
          </Button>
          <Button onClick={onRunIdeate} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" /> Run Ideate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StickyActionBar({
  onRunIdeate,
  onPushValidate,
  isRunning,
}: {
  onRunIdeate: () => void;
  onPushValidate: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-full max-w-5xl -translate-x-1/2 px-4">
      <Card className="shadow-lg border-muted">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Ready to ship?</p>
            <p className="text-xs text-muted-foreground">
              Keep ideating or push this set to Validate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onPushValidate}>
              <Send className="mr-2 h-4 w-4" /> Push to Validate
            </Button>
            <Button onClick={onRunIdeate} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" /> Run Ideate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
