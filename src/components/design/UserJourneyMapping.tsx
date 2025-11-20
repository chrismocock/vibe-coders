"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface UserJourneyMappingProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

interface JourneyStep {
  stage: string;
  action: string;
  emotion: string;
  touchpoint: string;
}

export default function UserJourneyMapping({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: UserJourneyMappingProps) {
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [painPoints, setPainPoints] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.user_journey) {
      const data = blueprint.user_journey;
      setJourneySteps(data.journeySteps || []);
      setPainPoints(data.painPoints || "");
      setOpportunities(data.opportunities || "");
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeJourneyStep(step: any): JourneyStep {
    return {
      stage: step.stage || step.stageName || "",
      action: step.action || step.userAction || "",
      emotion: step.emotion || step.userEmotion || "",
      touchpoint: step.touchpoint || step.touchPoint || "",
    };
  }

  function normalizeUserJourneyData(data: any): {
    journeySteps: JourneyStep[];
    painPoints: string;
    opportunities: string;
  } {
    // Handle different field name variations
    const journeyStepsRaw = data.journeySteps || data.journey_steps || data.steps || [];
    const painPoints = data.painPoints || data.pain_points || data.painPointsList || "";
    const opportunities = data.opportunities || data.opportunitiesList || "";

    // Normalize journey steps array
    let journeySteps: JourneyStep[] = [];
    if (Array.isArray(journeyStepsRaw)) {
      journeySteps = journeyStepsRaw.map((step) => normalizeJourneyStep(step));
    } else if (typeof journeyStepsRaw === "object" && journeyStepsRaw !== null) {
      // If it's a single object, wrap it in an array
      journeySteps = [normalizeJourneyStep(journeyStepsRaw)];
    }

    return {
      journeySteps,
      painPoints: typeof painPoints === "string" ? painPoints : JSON.stringify(painPoints),
      opportunities: typeof opportunities === "string" ? opportunities : JSON.stringify(opportunities),
    };
  }

  function parseUserJourneyFromAI(result: any): {
    journeySteps: JourneyStep[];
    painPoints: string;
    opportunities: string;
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeUserJourneyData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeUserJourneyData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseUserJourneyFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      journeySteps: [],
      painPoints: "",
      opportunities: "",
    };
  }

  function parseUserJourneyFromMarkdown(text: string): {
    journeySteps: JourneyStep[];
    painPoints: string;
    opportunities: string;
  } {
    const journeySteps: JourneyStep[] = [];
    
    // Try to extract journey steps from markdown
    const stepMatches = text.matchAll(/##\s*([^\n]+)\s*\n([\s\S]*?)(?=##|$)/g);
    for (const match of stepMatches) {
      const stage = match[1].trim();
      const content = match[2].trim();
      
      const actionMatch = content.match(/\*\*[Aa]ction\*\*[:\-]?\s*([^\n]+)/);
      const emotionMatch = content.match(/\*\*[Ee]motion\*\*[:\-]?\s*([^\n]+)/);
      const touchpointMatch = content.match(/\*\*[Tt]ouchpoint\*\*[:\-]?\s*([^\n]+)/);
      
      journeySteps.push({
        stage,
        action: actionMatch?.[1]?.trim() || "",
        emotion: emotionMatch?.[1]?.trim() || "",
        touchpoint: touchpointMatch?.[1]?.trim() || "",
      });
    }

    // Extract pain points
    const painPointsMatch = text.match(/\*\*[Pp]ain [Pp]oints\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const painPointsHeader = text.match(/##\s*[Pp]ain [Pp]oints\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    
    // Extract opportunities
    const opportunitiesMatch = text.match(/\*\*[Oo]pportunities\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const opportunitiesHeader = text.match(/##\s*[Oo]pportunities\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);

    return {
      journeySteps,
      painPoints: (painPointsMatch?.[1] || painPointsHeader?.[1] || "").trim(),
      opportunities: (opportunitiesMatch?.[1] || opportunitiesHeader?.[1] || "").trim(),
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
          section: "user_journey",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseUserJourneyFromAI(result);
        
        // Update state
        setJourneySteps(generatedData.journeySteps);
        setPainPoints(generatedData.painPoints);
        setOpportunities(generatedData.opportunities);
        
        // Save with the generated data directly
        await saveDataWithJourney(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      journeySteps,
      painPoints,
      opportunities,
    };
    return saveDataWithJourney(data);
  }

  async function saveDataWithJourney(data: {
    journeySteps: JourneyStep[];
    painPoints: string;
    opportunities: string;
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userJourney: data,
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

  const hasData = journeySteps.length > 0 || painPoints || opportunities;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              User Journey Mapping
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Map the user journey from awareness to retention
            </p>
          </div>
          {hasData && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vertical Timeline */}
        {journeySteps.length > 0 && (
          <div className="space-y-4 border-l-2 border-purple-200 pl-6">
            {journeySteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[29px] top-0 h-4 w-4 rounded-full bg-purple-600 border-2 border-white" />
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-600 uppercase">
                      {step.stage || `Stage ${index + 1}`}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-2">
                    <strong>Action:</strong> {step.action || "N/A"}
                  </p>
                  <p className="text-sm text-neutral-700 mb-2">
                    <strong>Emotion:</strong> {step.emotion || "N/A"}
                  </p>
                  <p className="text-sm text-neutral-700">
                    <strong>Touchpoint:</strong> {step.touchpoint || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Pain Points
          </label>
          <Textarea
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
            placeholder="Identify friction points and pain points in the user journey..."
            className="min-h-[100px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Opportunities
          </label>
          <Textarea
            value={opportunities}
            onChange={(e) => setOpportunities(e.target.value)}
            placeholder="Identify opportunities to improve the user experience..."
            className="min-h-[100px]"
            onBlur={saveData}
          />
        </div>

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
                Generate Journey Map
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

