import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MonetiseEconomicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Calculate Unit Economics",
      description: "Estimate customer lifetime value (LTV), customer acquisition cost (CAC), and payback period.",
      action: "Calculate",
    },
    {
      title: "Design Growth Loops",
      description: "Create referral, content, integration, and SEO loops with step-by-step setup instructions.",
      action: "Design Loops",
    },
    {
      title: "Create Revenue Roadmap",
      description: "Generate a month-by-month plan to reach your MRR goal within your selected time horizon.",
      action: "Create Roadmap",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Unit Economics & Growth</h1>
        <p className="text-base text-neutral-600">
          Calculate your unit economics, design growth loops, and create a revenue roadmap to achieve your
          monetization goals.
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
        <Link href={`/project/${id}/monetise`}>
          <Button variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

