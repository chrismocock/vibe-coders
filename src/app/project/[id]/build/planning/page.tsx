import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PlanningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Choose Build Approach",
      description: "Select how you'll build your product: build it yourself with AI assistance or send to developers with a PRD.",
      action: "Set Approach",
    },
    {
      title: "Set Your Budget",
      description: "Define your development budget to help determine the best tech stack and team composition.",
      action: "Set Budget",
    },
    {
      title: "Define Timeline",
      description: "Specify your target timeline for development, from MVP to full product launch.",
      action: "Set Timeline",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Build Planning</h1>
        <p className="text-base text-neutral-600">
          Plan your development approach by choosing how you'll build, setting your budget, and defining your
          timeline.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {actionCards.map((card, index) => (
          <Card key={index} className="border border-neutral-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                {card.title}
              </CardTitle>
              <CardDescription className="text-neutral-600">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                {card.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Back Button */}
      <div className="pt-4">
        <Link href={`/project/${id}/build`}>
          <Button variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

