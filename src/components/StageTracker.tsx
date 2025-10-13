import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Users, Wrench, Rocket, MessageSquare, Coins } from "lucide-react";

const stages = [
  { name: "Ideate", icon: Lightbulb },
  { name: "Validate", icon: Users },
  { name: "Design", icon: Wrench },
  { name: "Build", icon: Rocket },
  { name: "Launch", icon: MessageSquare },
  { name: "Monetise", icon: Coins },
];

export default function StageTracker() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {stages.map((S, i) => (
        <Card key={S.name}>
          <CardHeader className="flex items-center space-x-2">
            <S.icon className="h-4 w-4" />
            <CardTitle>{S.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={i === 0 ? 40 : 0} className="my-2" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}


