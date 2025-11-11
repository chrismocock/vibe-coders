import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function DesignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const progress = 0;

  const steps = [
    {
      number: 1,
      title: "Product Type & Features",
      description: "Define your product type (web app, mobile app, etc.) and identify the key features your product needs.",
      href: `/project/${id}/design/product`,
    },
    {
      number: 2,
      title: "User Personas",
      description: "Create detailed user personas to understand your target users, their needs, behaviors, and goals.",
      href: `/project/${id}/design/personas`,
    },
    {
      number: 3,
      title: "Design Style",
      description: "Define your design system with colors, typography, and UI elements that match your brand and users.",
      href: `/project/${id}/design/style`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Overall Progress</h2>
          <span className="text-sm text-neutral-600">{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Intro Text */}
      <div className="space-y-2">
        <p className="text-base text-neutral-700">
          Welcome to the Design stage. Here you'll define your product type, identify key features, create user
          personas, and establish a cohesive design system that will guide your product development.
        </p>
        <p className="text-sm text-neutral-600">
          Start by defining your product type and features, then create user personas, and finally establish
          your design style and tokens.
        </p>
      </div>

      {/* Step Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.number} className="border border-neutral-200 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 font-semibold">
                  {step.number}
                </div>
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {step.title}
                </CardTitle>
              </div>
              <CardDescription className="text-neutral-600">
                {step.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={step.href}>
                <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

