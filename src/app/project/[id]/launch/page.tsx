import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function LaunchOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const progress = 0;

  const steps = [
    {
      number: 1,
      title: "Planning",
      description: "Set your marketing budget and launch timeline to guide your launch strategy.",
      href: `/project/${id}/launch/planning`,
    },
    {
      number: 2,
      title: "Strategy",
      description: "Develop your launch strategy and identify the primary channels for reaching your audience.",
      href: `/project/${id}/launch/strategy`,
    },
    {
      number: 3,
      title: "Tactics",
      description: "Create a detailed launch tactics plan with week-by-week actions and content schedule.",
      href: `/project/${id}/launch/tactics`,
    },
    {
      number: 4,
      title: "Growth",
      description: "Build a community strategy and set up metrics tracking to measure launch success.",
      href: `/project/${id}/launch/growth`,
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
          Welcome to the Launch stage. Here you'll create a comprehensive launch and marketing strategy to
          introduce your product to the world and start building your user base.
        </p>
        <p className="text-sm text-neutral-600">
          Start by planning your budget and timeline, then develop your launch strategy, create tactical plans,
          and set up growth systems.
        </p>
      </div>

      {/* Step Cards */}
      <div className="grid gap-6 md:grid-cols-2">
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

