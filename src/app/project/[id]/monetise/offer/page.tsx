"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";

export default function OfferPlanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/offer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("offer", data.result);
        markComplete("offer");
      }
    } catch (error) {
      console.error("Failed to generate offer plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  const offerPlan = blueprint?.offer_plan;

  return (
    <MonetiseSectionShell
      title="Offer & Plan Builder"
      description="Create pricing tiers, feature comparisons, and value propositions."
      sectionId="offer"
      onGenerate={handleGenerate}
      generating={generating}
      previousSection={{ href: `/project/${projectId}/monetise/pricing`, label: "Pricing Strategy" }}
      nextSection={{ href: `/project/${projectId}/monetise/checkout`, label: "Checkout & Payment" }}
    >
      {offerPlan ? (
        <div className="space-y-6">
          {offerPlan.tiers && offerPlan.tiers.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Pricing Tiers</h3>
                <div className="space-y-4">
                  {offerPlan.tiers.map((tier: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{tier.name} - ${tier.price}/{tier.billing}</h4>
                      <p className="text-sm text-neutral-600 mb-2">{tier.description}</p>
                      <ul className="list-disc list-inside text-sm">
                        {tier.features.map((feature: string, fIdx: number) => (
                          <li key={fIdx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">Click "Generate with AI" to create your offer plan.</p>
          </CardContent>
        </Card>
      )}
    </MonetiseSectionShell>
  );
}

