"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, CheckCircle2 } from "lucide-react";

interface MVPDefinitionProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

interface EffortImpactItem {
  feature: string;
  effort: number; // 1-5
  impact: number; // 1-5
}

export default function MVPDefinition({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: MVPDefinitionProps) {
  const [mvpFeatureList, setMvpFeatureList] = useState("");
  const [releaseRoadmap, setReleaseRoadmap] = useState("");
  const [effortImpactChart, setEffortImpactChart] = useState<EffortImpactItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.mvp_definition) {
      const data = blueprint.mvp_definition;
      setMvpFeatureList(data.mvpFeatureList || "");
      setReleaseRoadmap(data.releaseRoadmap || "");
      setEffortImpactChart(data.effortImpactChart || []);
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeEffortImpactItem(item: any): EffortImpactItem {
    return {
      feature: item.feature || item.name || "",
      effort: typeof item.effort === "number" ? Math.max(1, Math.min(5, item.effort)) : 3,
      impact: typeof item.impact === "number" ? Math.max(1, Math.min(5, item.impact)) : 3,
    };
  }

  function normalizeMVPDefinitionData(data: any): {
    mvpFeatureList: string;
    releaseRoadmap: string;
    effortImpactChart: EffortImpactItem[];
  } {
    // Handle different field name variations
    const mvpFeatureList = data.mvpFeatureList || data.mvp_feature_list || data.featureList || data.features || "";
    const releaseRoadmap = data.releaseRoadmap || data.release_roadmap || data.roadmap || "";
    const effortImpactChartRaw = data.effortImpactChart || data.effort_impact_chart || data.chart || [];

    let effortImpactChart: EffortImpactItem[] = [];
    if (Array.isArray(effortImpactChartRaw)) {
      effortImpactChart = effortImpactChartRaw.map((item) => normalizeEffortImpactItem(item));
    } else if (typeof effortImpactChartRaw === "object" && effortImpactChartRaw !== null) {
      // Single object, wrap in array
      effortImpactChart = [normalizeEffortImpactItem(effortImpactChartRaw)];
    }

    return {
      mvpFeatureList: typeof mvpFeatureList === "string" ? mvpFeatureList : JSON.stringify(mvpFeatureList),
      releaseRoadmap: typeof releaseRoadmap === "string" ? releaseRoadmap : JSON.stringify(releaseRoadmap),
      effortImpactChart,
    };
  }

  function parseMVPDefinitionFromAI(result: any): {
    mvpFeatureList: string;
    releaseRoadmap: string;
    effortImpactChart: EffortImpactItem[];
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeMVPDefinitionData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeMVPDefinitionData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseMVPDefinitionFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      mvpFeatureList: "",
      releaseRoadmap: "",
      effortImpactChart: [],
    };
  }

  function parseMVPDefinitionFromMarkdown(text: string): {
    mvpFeatureList: string;
    releaseRoadmap: string;
    effortImpactChart: EffortImpactItem[];
  } {
    // Extract fields using common markdown patterns
    const featureListMatch = text.match(/\*\*[Mm][Vv][Pp] [Ff]eature [Ll]ist\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const roadmapMatch = text.match(/\*\*[Rr]elease [Rr]oadmap\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const chartMatch = text.match(/\*\*[Ee]ffort-[Ii]mpact [Cc]hart\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    
    // Also try header patterns
    const featureListHeader = text.match(/##\s*[Mm][Vv][Pp] [Ff]eature [Ll]ist\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const roadmapHeader = text.match(/##\s*[Rr]elease [Rr]oadmap\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const chartHeader = text.match(/##\s*[Ee]ffort-[Ii]mpact [Cc]hart\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);

    const mvpFeatureList = (featureListMatch?.[1] || featureListHeader?.[1] || "").trim();
    const releaseRoadmap = (roadmapMatch?.[1] || roadmapHeader?.[1] || "").trim();
    
    // Try to parse effort-impact chart from text
    let effortImpactChart: EffortImpactItem[] = [];
    const chartText = (chartMatch?.[1] || chartHeader?.[1] || "").trim();
    if (chartText) {
      // Try to find JSON array in the text
      const jsonMatch = chartText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            effortImpactChart = parsed.map((item) => normalizeEffortImpactItem(item));
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    return {
      mvpFeatureList,
      releaseRoadmap,
      effortImpactChart,
    };
  }

  async function generateSection() {
    try {
      setGenerating(true);
      const response = await fetch("/api/design/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          section: "mvp_definition",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseMVPDefinitionFromAI(result);
        
        // Update state
        setMvpFeatureList(generatedData.mvpFeatureList);
        setReleaseRoadmap(generatedData.releaseRoadmap);
        setEffortImpactChart(generatedData.effortImpactChart);
        
        // Save with the generated data directly
        await saveDataWithMVPDefinition(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      mvpFeatureList,
      releaseRoadmap,
      effortImpactChart,
    };
    return saveDataWithMVPDefinition(data);
  }

  async function saveDataWithMVPDefinition(data: {
    mvpFeatureList: string;
    releaseRoadmap: string;
    effortImpactChart: EffortImpactItem[];
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          mvpDefinition: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Update blueprint from save response instead of refetching
        if (result.blueprint) {
          onUpdate?.(result.blueprint);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }

  const hasData = mvpFeatureList || releaseRoadmap || effortImpactChart.length > 0;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              MVP Definition
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Define MVP features, release roadmap, and effort-impact analysis
            </p>
          </div>
          {hasData && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            MVP Feature List
          </label>
          <Textarea
            value={mvpFeatureList}
            onChange={(e) => setMvpFeatureList(e.target.value)}
            placeholder="List the core features for your MVP..."
            className="min-h-[120px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Release Roadmap
          </label>
          <Textarea
            value={releaseRoadmap}
            onChange={(e) => setReleaseRoadmap(e.target.value)}
            placeholder="Phase 1: MVP features, Phase 2: Core features, Phase 3: Stretch features..."
            className="min-h-[150px]"
            onBlur={saveData}
          />
        </div>

        {effortImpactChart.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Effort-Impact Chart
            </label>
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-neutral-600 mb-2">
                <div>Feature</div>
                <div className="text-center">Effort</div>
                <div className="text-center">Impact</div>
              </div>
              {effortImpactChart.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-neutral-200 last:border-0">
                  <div className="text-neutral-700">{item.feature}</div>
                  <div className="text-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      {item.effort}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={generateSection}
            disabled={generating}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate MVP Definition
              </>
            )}
          </Button>
          {saving && (
            <span className="text-sm text-neutral-500">Saving...</span>
          )}
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

