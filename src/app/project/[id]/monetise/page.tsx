import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function MonetiseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const progress = 0;

  const steps = [
    {
      number: 1,
      title: "Goals",
      description: "Set your revenue goals and time horizon to guide your monetization strategy.",
      href: `/project/${id}/monetise/goals`,
    },
    {
      number: 2,
      title: "Business Model",
      description: "Define your business model, pricing tiers, and identify your first paying customers.",
      href: `/project/${id}/monetise/model`,
    },
    {
      number: 3,
      title: "Economics",
      description: "Calculate unit economics, design growth loops, and create a revenue roadmap.",
      href: `/project/${id}/monetise/economics`,
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
          Welcome to the Monetise stage. Here you'll develop your revenue streams, define your business model,
          set pricing strategies, and create a plan to achieve your revenue goals.
        </p>
        <p className="text-sm text-neutral-600">
          Start by setting your revenue goals, then define your business model and pricing, and finally calculate
          your unit economics and growth strategy.
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

