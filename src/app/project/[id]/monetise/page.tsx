"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, ArrowRight, CreditCard, DollarSign, Gift, Lock } from "lucide-react";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseOverviewChecklist from "@/components/monetise/MonetiseOverviewChecklist";
import { MONETISATION_MODELS } from "@/lib/monetise/constants";

export default function MonetiseOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, buildPathMode, saveBlueprint, markComplete } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);

  const handleModelSelect = async (model: string) => {
    await saveBlueprint({ monetisationModel: model });
    markComplete("overview");
  };

  const handleRecommend = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/overview/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result?.recommendedModel) {
          await handleModelSelect(data.result.recommendedModel);
        }
      }
    } catch (error) {
      console.error("Failed to get recommendation:", error);
    } finally {
      setGenerating(false);
    }
  };

  const modelCards = [
    {
      id: MONETISATION_MODELS.SUBSCRIPTION,
      title: "Subscription",
      description: "Recurring monthly or yearly payments",
      icon: CreditCard,
    },
    {
      id: MONETISATION_MODELS.ONE_TIME,
      title: "One-Time Purchase",
      description: "Single payment for lifetime access",
      icon: DollarSign,
    },
    {
      id: MONETISATION_MODELS.FREEMIUM,
      title: "Freemium",
      description: "Free tier with paid upgrades",
      icon: Gift,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-neutral-900">
          Time to turn your product into income
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl">
          Choose your monetisation model and build a complete revenue strategy with pricing, offers, and checkout flows.
        </p>
        {buildPathMode && (
          <Badge variant="outline" className="w-fit">
            Build Path: {buildPathMode}
          </Badge>
        )}
      </div>

      {/* Monetisation Model Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            Choose Your Monetisation Model
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecommend}
            disabled={generating}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Get AI recommendation"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelCards.map((card) => {
            const Icon = card.icon;
            const isSelected = blueprint?.monetisation_model === card.id;
            return (
              <Card
                key={card.id}
                className={isSelected ? "border-purple-500 bg-purple-50" : "cursor-pointer hover:border-purple-300"}
                onClick={() => handleModelSelect(card.id)}
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
      <MonetiseOverviewChecklist />

      {/* CTA */}
      {blueprint?.monetisation_model && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              window.location.href = `/project/${projectId}/monetise/pricing`;
            }}
            className="flex items-center gap-2"
          >
            Start Pricing Strategy
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
