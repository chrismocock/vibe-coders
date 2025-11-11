import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Development Timeline",
      description: "Create a realistic development timeline with milestones, phases, and deliverables.",
      action: "Create Timeline",
    },
    {
      title: "Team Composition",
      description: "Determine the ideal team size and roles needed for your project based on scope and complexity.",
      action: "Plan Team",
    },
    {
      title: "Budget Breakdown",
      description: "Get a detailed cost breakdown for development, tools, infrastructure, and other expenses.",
      action: "Calculate Costs",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Execution Plan</h1>
        <p className="text-base text-neutral-600">
          Create your execution plan with a development timeline, team composition, and detailed budget
          breakdown.
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

