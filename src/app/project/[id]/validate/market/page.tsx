import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Research Market Size",
      description: "Analyze your total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM).",
      action: "Start Research",
    },
    {
      title: "Analyze Target Customers",
      description: "Identify your ideal customer profile, understand their demographics, behaviors, and pain points.",
      action: "Analyze Customers",
    },
    {
      title: "Assess Market Opportunity",
      description: "Evaluate market trends, growth potential, and competitive landscape to understand the opportunity size.",
      action: "Assess Opportunity",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Market Validation</h1>
        <p className="text-base text-neutral-600">
          Understand your target market, customer needs, and market size to validate that there's a real
          opportunity for your idea.
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
        <Link href={`/project/${id}/validate`}>
          <Button variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

