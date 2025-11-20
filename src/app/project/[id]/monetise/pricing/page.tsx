"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";

export default function PricingStrategyPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/pricing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("pricing", data.result);
        markComplete("pricing");
      }
    } catch (error) {
      console.error("Failed to generate pricing strategy:", error);
    } finally {
      setGenerating(false);
    }
  };

  const pricingStrategy = blueprint?.pricing_strategy;

  return (
    <MonetiseSectionShell
      title="Pricing Strategy"
      description="Get AI-powered pricing recommendations with competitor analysis and value justification."
      sectionId="pricing"
      onGenerate={handleGenerate}
      generating={generating}
      previousSection={{ href: `/project/${projectId}/monetise`, label: "Overview" }}
      nextSection={{ href: `/project/${projectId}/monetise/offer`, label: "Offer & Plan Builder" }}
    >
      {pricingStrategy ? (
        <div className="space-y-6">
          {pricingStrategy.recommendedPricing && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Recommended Pricing</h3>
                <div className="space-y-2">
                  <p><strong>Monthly:</strong> ${pricingStrategy.recommendedPricing.monthlyPrice}</p>
                  <p><strong>Yearly:</strong> ${pricingStrategy.recommendedPricing.yearlyPrice}</p>
                  <p><strong>Justification:</strong> {pricingStrategy.recommendedPricing.valueJustification}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {pricingStrategy.competitorBenchmarks && pricingStrategy.competitorBenchmarks.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Competitor Benchmarks</h3>
                <ul className="space-y-2">
                  {pricingStrategy.competitorBenchmarks.map((benchmark: any, idx: number) => (
                    <li key={idx}>
                      <strong>{benchmark.competitor}:</strong> {benchmark.price} - {benchmark.notes}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">Click "Generate with AI" to create your pricing strategy.</p>
          </CardContent>
        </Card>
      )}
    </MonetiseSectionShell>
  );
}

