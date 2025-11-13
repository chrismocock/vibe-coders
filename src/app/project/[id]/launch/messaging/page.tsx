"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Copy, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { useParams } from "next/navigation";

export default function LaunchMessagingPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);

  const messaging = blueprint?.messaging_framework || {};

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/messaging/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("messaging", data.result);
        markComplete("messaging");
      }
    } catch (error) {
      console.error("Failed to generate messaging:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = JSON.stringify(messaging, null, 2);
    navigator.clipboard.writeText(text);
  };

  const handleFieldChange = (field: string, value: any) => {
    saveSection("messaging", { ...messaging, [field]: value });
  };

  return (
    <LaunchSectionShell
      sectionId="messaging"
      title="Messaging & Positioning"
      description="Define your product's messaging framework, value proposition, and key talking points."
      aiButton={
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Messaging Guide
            </>
          )}
        </Button>
      }
      nextSection="landing"
      nextSectionLabel="Continue to Landing Page & Onboarding"
      onComplete={() => markComplete("messaging")}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Framework
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tagline</label>
            <Input
              value={messaging.tagline || ""}
              onChange={(e) => handleFieldChange("tagline", e.target.value)}
              placeholder="Your compelling one-line tagline"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Textarea
              value={messaging.shortDescription || ""}
              onChange={(e) =>
                handleFieldChange("shortDescription", e.target.value)
              }
              placeholder="1-2 sentence description"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Value Proposition</label>
            <Textarea
              value={messaging.valueProposition || ""}
              onChange={(e) =>
                handleFieldChange("valueProposition", e.target.value)
              }
              placeholder="What makes this unique and valuable"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Pain to Solution</label>
            <Textarea
              value={messaging.painToSolution || ""}
              onChange={(e) =>
                handleFieldChange("painToSolution", e.target.value)
              }
              placeholder="How the product solves the pain point"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Key Benefits</label>
            <div className="space-y-2 mt-2">
              {(messaging.benefits || []).map((benefit: string, idx: number) => (
                <Input
                  key={idx}
                  value={benefit}
                  onChange={(e) => {
                    const newBenefits = [...(messaging.benefits || [])];
                    newBenefits[idx] = e.target.value;
                    handleFieldChange("benefits", newBenefits);
                  }}
                  placeholder="Benefit"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </LaunchSectionShell>
  );
}

