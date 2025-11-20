"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Copy, Loader2 } from "lucide-react";
import { useLaunchBlueprint } from "@/contexts/LaunchStageContext";
import LaunchSectionShell from "@/components/launch/LaunchSectionShell";
import { TONE_OPTIONS, ASSET_TYPES } from "@/lib/launch/constants";
import { useParams } from "next/navigation";

export default function LaunchAssetsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint, saveSection, markComplete } = useLaunchBlueprint();
  const [generating, setGenerating] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("fun");

  const assets = blueprint?.marketing_assets?.assets || [];

  const handleGenerate = async (assetType?: string, tone?: string) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/launch/assets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          assetType: assetType || selectedAssetType,
          tone: tone || selectedTone,
        }),
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <LaunchSectionShell
      sectionId="assets"
      title="Marketing Assets"
      description="Generate marketing content for various platforms with customizable tone."
      nextSection="metrics"
      nextSectionLabel="Continue to Tracking & Metrics"
      onComplete={() => markComplete("assets")}
    >
      <div className="space-y-6">
        {/* Generate Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate New Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Asset Type</label>
                <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tone</label>
                <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger>
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
            </div>
            <Button
              onClick={() => handleGenerate()}
              disabled={generating || !selectedAssetType}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Asset
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Assets */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Assets</h3>
          <div className="grid grid-cols-1 gap-4">
            {assets.map((asset: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {asset.type?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {asset.tone}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(asset.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate(asset.type, asset.tone)}
                        disabled={generating}
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                    {asset.content}
                  </p>
                  {asset.notes && (
                    <p className="text-xs text-neutral-500 mt-2">{asset.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </LaunchSectionShell>
  );
}

