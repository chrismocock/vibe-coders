import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MonetiseModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Choose Business Model",
      description: "Select the best business model for your product (SaaS, usage-based, marketplace, etc.) with rationale.",
      action: "Choose Model",
    },
    {
      title: "Design Pricing Tiers",
      description: "Create pricing tiers with price points, feature matrices, and an upgrade path for your customers.",
      action: "Set Pricing",
    },
    {
      title: "Identify Paying Customers",
      description: "Define your first paying customer segment, buying triggers, and where to find them.",
      action: "Identify Customers",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Business Model & Pricing</h1>
        <p className="text-base text-neutral-600">
          Define your business model, create pricing tiers, and identify your first paying customers to establish
          a sustainable revenue stream.
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

