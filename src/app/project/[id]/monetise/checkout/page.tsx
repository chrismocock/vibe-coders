"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";

export default function CheckoutFlowPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete, buildPathMode } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/checkout/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("checkout", data.result);
        markComplete("checkout");
      }
    } catch (error) {
      console.error("Failed to generate checkout flow:", error);
    } finally {
      setGenerating(false);
    }
  };

  const checkoutFlow = blueprint?.checkout_flow;

  return (
    <MonetiseSectionShell
      title="Checkout & Payment Flow"
      description={`Generate checkout flows adapted to your build path: ${buildPathMode || "Not specified"}`}
      sectionId="checkout"
      onGenerate={handleGenerate}
      generating={generating}
      previousSection={{ href: `/project/${projectId}/monetise/offer`, label: "Offer & Plan" }}
      nextSection={{ href: `/project/${projectId}/monetise/activation`, label: "Activation & Onboarding" }}
    >
      {checkoutFlow ? (
        <div className="space-y-6">
          {checkoutFlow.checkoutSteps && checkoutFlow.checkoutSteps.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Checkout Steps</h3>
                <ol className="space-y-3">
                  {checkoutFlow.checkoutSteps.map((step: any, idx: number) => (
                    <li key={idx} className="border-l-2 pl-4">
                      <strong>Step {step.step}: {step.title}</strong>
                      <p className="text-sm text-neutral-600">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
          {checkoutFlow.buildPathInstructions && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Build Path Instructions</h3>
                <div className="space-y-4">
                  {checkoutFlow.buildPathInstructions.ai_tools && (
                    <div>
                      <h4 className="font-medium mb-2">AI Tools Instructions:</h4>
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{checkoutFlow.buildPathInstructions.ai_tools}</p>
                    </div>
                  )}
                  {checkoutFlow.buildPathInstructions.hire_dev && (
                    <div>
                      <h4 className="font-medium mb-2">Developer Requirements:</h4>
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{checkoutFlow.buildPathInstructions.hire_dev}</p>
                    </div>
                  )}
                  {checkoutFlow.buildPathInstructions.advanced && (
                    <div>
                      <h4 className="font-medium mb-2">Advanced Technical Specs:</h4>
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{checkoutFlow.buildPathInstructions.advanced}</p>
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
            <p className="text-neutral-600">Click "Generate with AI" to create your checkout flow.</p>
          </CardContent>
        </Card>
      )}
    </MonetiseSectionShell>
  );
}

