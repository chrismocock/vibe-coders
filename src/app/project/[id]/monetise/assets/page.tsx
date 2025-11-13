"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import MonetiseSectionShell from "@/components/monetise/MonetiseSectionShell";
import { TONE_OPTIONS } from "@/lib/monetise/constants";

export default function AssetsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useMonetiseBlueprint();
  const [generating, setGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string>("professional");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/monetise/assets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tone: selectedTone }),
      });

      if (response.ok) {
        const data = await response.json();
        await saveSection("assets", data.result);
        markComplete("assets");
      }
    } catch (error) {
      console.error("Failed to generate assets:", error);
    } finally {
      setGenerating(false);
    }
  };

  const assets = blueprint?.monetisation_assets;

  return (
    <MonetiseSectionShell
      title="Monetisation Assets"
      description="Generate sales copy, emails, and promotional content with customizable tone."
      sectionId="assets"
      onGenerate={handleGenerate}
      generating={generating}
      previousSection={{ href: `/project/${projectId}/monetise/activation`, label: "Activation & Onboarding" }}
      nextSection={{ href: `/project/${projectId}/monetise/pack`, label: "Revenue Pack" }}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Tone:</label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {assets ? (
          <div className="space-y-6">
            {assets.assets && assets.assets.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assets</h3>
                  <div className="space-y-4">
                    {assets.assets.map((asset: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{asset.type}</h4>
                          <span className="text-xs text-neutral-500">{asset.tone}</span>
                        </div>
                        <p className="text-sm text-neutral-600 whitespace-pre-wrap">{asset.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {assets.emailSequences && assets.emailSequences.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Email Sequences</h3>
                  <div className="space-y-4">
                    {assets.emailSequences.map((sequence: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{sequence.name}</h4>
                        <p className="text-sm text-neutral-500 mb-3">Trigger: {sequence.trigger}</p>
                        {sequence.emails && sequence.emails.map((email: any, eIdx: number) => (
                          <div key={eIdx} className="mb-3 pl-4 border-l-2">
                            <p className="text-sm font-medium">Day {email.delay}: {email.subject}</p>
                            <p className="text-sm text-neutral-600 whitespace-pre-wrap">{email.body}</p>
                          </div>
                        ))}
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
              <p className="text-neutral-600">Select a tone and click "Generate with AI" to create your monetisation assets.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MonetiseSectionShell>
  );
}

