import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LaunchTacticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Create Launch Tactics",
      description: "Develop a week-by-week pre-launch and launch action plan with specific tactics and activities.",
      action: "Create Tactics",
    },
    {
      title: "Content Plan",
      description: "Design a content strategy with specific content ideas, posting schedules, and distribution channels.",
      action: "Plan Content",
    },
    {
      title: "Pre-Launch Activities",
      description: "Plan your pre-launch activities, including beta testing, early access, and building anticipation.",
      action: "Plan Activities",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Launch Tactics</h1>
        <p className="text-base text-neutral-600">
          Create detailed launch tactics with a week-by-week action plan, content strategy, and pre-launch
          activities.
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

