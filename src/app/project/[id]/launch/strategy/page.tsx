import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LaunchStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Develop Launch Strategy",
      description: "Create a comprehensive launch strategy tailored to your product, budget, and timeline.",
      action: "Create Strategy",
    },
    {
      title: "Choose Primary Channel",
      description: "Identify the best launch channel for your product based on your target audience and budget.",
      action: "Select Channel",
    },
    {
      title: "Define Messaging",
      description: "Craft your core messaging and value proposition to communicate clearly with your audience.",
      action: "Define Messaging",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Launch Strategy</h1>
        <p className="text-base text-neutral-600">
          Develop your launch strategy, identify primary channels, and define your messaging to effectively
          introduce your product to the market.
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
        <Link href={`/project/${id}/launch`}>
          <Button variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

