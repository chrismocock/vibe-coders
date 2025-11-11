import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function BuildOverviewPage({
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
      description: "Choose your build approach, set your budget and timeline, and plan your development strategy.",
      href: `/project/${id}/build/planning`,
    },
    {
      number: 2,
      title: "Technical",
      description: "Define your tech stack, technical requirements, and architecture for your product.",
      href: `/project/${id}/build/technical`,
    },
    {
      number: 3,
      title: "Execution",
      description: "Create a development timeline, determine team size and roles, and plan your budget breakdown.",
      href: `/project/${id}/build/execution`,
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
          Welcome to the Build stage. Here you'll plan your development approach, define your technical stack,
          and create a roadmap for building your MVP and core features.
        </p>
        <p className="text-sm text-neutral-600">
          Start by planning your build approach and resources, then define your technical requirements, and
          finally create your execution timeline and team plan.
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

