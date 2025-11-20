"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Download, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { useParams } from "next/navigation";

export default function LaunchLandingPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);

  const landing = blueprint?.landing_onboarding || {};

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/landing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("landing", data.result);
        markComplete("landing");
      }
    } catch (error) {
      console.error("Failed to generate landing content:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    const content = JSON.stringify(landing, null, 2);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "landing-onboarding.md";
    a.click();
  };

  return (
    <LaunchSectionShell
      sectionId="landing"
      title="Landing Page & Onboarding"
      description="Create landing page content and onboarding email sequences."
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
              Generate Landing Content
            </>
          )}
        </Button>
      }
      nextSection="adopters"
      nextSectionLabel="Continue to Early Adopters"
      onComplete={() => markComplete("landing")}
    >
      <Tabs defaultValue="landing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="landing" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Markdown
            </Button>
          </div>

          {landing.landingPage && (
            <div className="space-y-4 p-4 border border-neutral-200 rounded-lg">
              <div>
                <h3 className="font-semibold">Hero Text</h3>
                <p className="text-neutral-600">{landing.landingPage.heroText}</p>
              </div>
              <div>
                <h3 className="font-semibold">Subheading</h3>
                <p className="text-neutral-600">{landing.landingPage.subheading}</p>
              </div>
              <div>
                <h3 className="font-semibold">CTA</h3>
                <p className="text-neutral-600">{landing.landingPage.cta}</p>
              </div>
              {landing.landingPage.featureBullets && (
                <div>
                  <h3 className="font-semibold">Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {landing.landingPage.featureBullets.map((f: string, i: number) => (
                      <li key={i} className="text-neutral-600">{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          {landing.onboarding && (
            <div className="space-y-6">
              <div className="p-4 border border-neutral-200 rounded-lg">
                <h3 className="font-semibold mb-2">Welcome Email</h3>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {landing.onboarding.welcomeEmail}
                </p>
              </div>
              <div className="p-4 border border-neutral-200 rounded-lg">
                <h3 className="font-semibold mb-2">How It Works Email</h3>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {landing.onboarding.howItWorksEmail}
                </p>
              </div>
              {landing.onboarding.steps && (
                <div>
                  <h3 className="font-semibold mb-2">Onboarding Steps</h3>
                  <div className="space-y-2">
                    {landing.onboarding.steps.map((step: any, i: number) => (
                      <div key={i} className="p-3 border border-neutral-200 rounded-lg">
                        <div className="font-medium">Step {step.step}: {step.title}</div>
                        <p className="text-sm text-neutral-600 mt-1">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </LaunchSectionShell>
  );
}

