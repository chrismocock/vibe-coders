import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";

export function ValidateHandoffPanel({
  hasPushed,
  onPush,
}: {
  hasPushed: boolean;
  onPush: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="text-sm text-muted-foreground">Validation</p>
          <CardTitle>Push for validation</CardTitle>
        </div>
        {hasPushed && <Badge className="bg-green-600 text-white">Sent</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Ship this ideation run to the Validate lane with experiments and next steps included.
        </p>
        <Button onClick={onPush} variant={hasPushed ? "outline" : "default"}>
          <Send className="mr-2 h-4 w-4" /> {hasPushed ? "Resend" : "Send to Validate"}
        </Button>
      </CardContent>
    </Card>
  );
}
