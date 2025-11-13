"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";

export default function ActivationPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/activation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("activation", data.result);
        markComplete("activation");
      }
    } catch (error) {
      console.error("Failed to generate activation blueprint:", error);
    } finally {
      setGenerating(false);
    }
  };

  const activationBlueprint = blueprint?.activation_blueprint;

  return (
    <MonetiseSectionShell
      title="Activation & Onboarding Optimisation"
      description="Create activation funnels and messaging to convert free users to paying customers."
      sectionId="activation"
      onGenerate={handleGenerate}
      generating={generating}
      previousSection={{ href: `/project/${projectId}/monetise/checkout`, label: "Checkout & Payment" }}
      nextSection={{ href: `/project/${projectId}/monetise/assets`, label: "Monetisation Assets" }}
    >
      {activationBlueprint ? (
        <div className="space-y-6">
          {activationBlueprint.activationFunnel && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Activation Funnel</h3>
                <div className="space-y-4">
                  {activationBlueprint.activationFunnel.steps && activationBlueprint.activationFunnel.steps.map((step: any, idx: number) => (
                    <div key={idx} className="border-l-2 pl-4">
                      <strong>Step {step.step}: {step.title}</strong>
                      <p className="text-sm text-neutral-600">{step.description}</p>
                      <p className="text-xs text-neutral-500 mt-1">Goal: {step.goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {activationBlueprint.messaging && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Messaging</h3>
                <div className="space-y-4">
                  {activationBlueprint.messaging.welcomeEmail && (
                    <div>
                      <h4 className="font-medium mb-2">Welcome Email:</h4>
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{activationBlueprint.messaging.welcomeEmail}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">Click "Generate with AI" to create your activation blueprint.</p>
          </CardContent>
        </Card>
      )}
    </MonetiseSectionShell>
  );
}

