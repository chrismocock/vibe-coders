"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { useParams } from "next/navigation";

export default function LaunchAdoptersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);

  const adopters = blueprint?.early_adopters || {};

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/adopters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("adopters", data.result);
        markComplete("adopters");
      }
    } catch (error) {
      console.error("Failed to generate early adopters plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <LaunchSectionShell
      sectionId="adopters"
      title="Early Adopters & Outreach"
      description="Identify early adopter personas, channels, and create outreach templates."
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
              Generate Early Adopter Plan
            </>
          )}
        </Button>
      }
      nextSection="assets"
      nextSectionLabel="Continue to Marketing Assets"
      onComplete={() => markComplete("adopters")}
    >
      <div className="space-y-6">
        {/* Personas */}
        {adopters.personas && adopters.personas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Early Adopter Personas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adopters.personas.map((persona: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{persona.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-neutral-600">{persona.description}</p>
                    {persona.painPoints && (
                      <div>
                        <span className="text-xs font-medium">Pain Points:</span>
                        <ul className="list-disc list-inside text-sm text-neutral-600">
                          {persona.painPoints.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Channels */}
        {adopters.channels && adopters.channels.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Acquisition Channels</h3>
            <div className="space-y-2">
              {adopters.channels.map((channel: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600">{channel.description}</p>
                    {channel.tactics && (
                      <div className="mt-2">
                        <span className="text-xs font-medium">Tactics:</span>
                        <ul className="list-disc list-inside text-sm text-neutral-600 mt-1">
                          {channel.tactics.map((t: string, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Outreach Templates */}
        {adopters.outreachPlan && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Outreach Templates</h3>
            {adopters.outreachPlan.emails && (
              <div>
                <h4 className="font-medium mb-2">Email Templates</h4>
                <div className="space-y-2">
                  {adopters.outreachPlan.emails.map((email: any, idx: number) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-sm">Subject: {email.subject}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                          {email.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LaunchSectionShell>
  );
}

