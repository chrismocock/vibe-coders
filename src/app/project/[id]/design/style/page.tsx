import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actionCards = [
    {
      title: "Define Color Palette",
      description: "Choose a color palette that reflects your brand identity and creates the right emotional response from users.",
      action: "Set Colors",
    },
    {
      title: "Select Typography",
      description: "Choose fonts and typography styles that enhance readability and align with your brand personality.",
      action: "Choose Fonts",
    },
    {
      title: "Design UI Components",
      description: "Define the visual style for buttons, cards, inputs, and other UI components to create a cohesive design system.",
      action: "Design Components",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Design Style</h1>
        <p className="text-base text-neutral-600">
          Establish a complete design system with colors, typography, and UI elements that create a cohesive
          and professional user experience.
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
        <Link href={`/project/${id}/design`}>
          <Button variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

