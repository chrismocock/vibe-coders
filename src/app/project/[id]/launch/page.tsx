"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, ArrowRight, Rocket, Users, Lock } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchOverviewChecklist from "@/components/launch/LaunchOverviewChecklist";
import { LAUNCH_PATH_CHOICES } from "@/lib/launch/constants";

export default function LaunchOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, buildPathMode, saveBlueprint, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);

  const handlePathSelect = async (path: string) => {
    await saveBlueprint({ launchPathChoice: path });
    markComplete("overview");
  };

  const handleRecommend = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, recommendationMode: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result?.recommendedPath) {
          await handlePathSelect(data.result.recommendedPath);
        }
      }
    } catch (error) {
      console.error("Failed to get recommendation:", error);
    } finally {
      setGenerating(false);
    }
  };

  const pathCards = [
    {
      id: LAUNCH_PATH_CHOICES.SOFT_LAUNCH,
      title: "Soft Launch",
      description: "Test with a small group before going public",
      icon: Lock,
    },
    {
      id: LAUNCH_PATH_CHOICES.PUBLIC_LAUNCH,
      title: "Public Launch",
      description: "Launch publicly to everyone at once",
      icon: Rocket,
    },
    {
      id: LAUNCH_PATH_CHOICES.PRIVATE_BETA,
      title: "Private Beta",
      description: "Invite-only beta for early adopters",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-neutral-900">
          Launch Your Product
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl">
          Plan and execute your product launch with a comprehensive strategy,
          messaging, and marketing assets.
        </p>
        {buildPathMode && (
          <Badge variant="outline" className="w-fit">
            Build Path: {buildPathMode}
          </Badge>
        )}
      </div>

      {/* Launch Path Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            Choose Your Launch Path
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecommend}
            disabled={generating}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Recommend my launch approach"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pathCards.map((card) => {
            const Icon = card.icon;
            const isSelected = blueprint?.launch_path_choice === card.id;
            return (
              <Card
                key={card.id}
                className={isSelected ? "border-purple-500 bg-purple-50" : "cursor-pointer hover:border-purple-300"}
                onClick={() => handlePathSelect(card.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <LaunchOverviewChecklist />

      {/* CTA */}
      {blueprint?.launch_path_choice && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              window.location.href = `/project/${projectId}/launch/strategy`;
            }}
            className="flex items-center gap-2"
          >
            Start Launch Strategy
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
