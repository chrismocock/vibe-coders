"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface AcceptanceCriterion {
  id: string;
  text: string;
}

interface EdgeCase {
  id: string;
  text: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  userStory: string;
  acceptanceCriteria: AcceptanceCriterion[];
  edgeCases: EdgeCase[];
  tier: "must" | "should";
  lastGeneratedAt?: string;
}

interface FeatureUserStoriesProps {
  projectId: string;
  mvpScope?: any;
  ideaContext?: string;
}

export default function FeatureUserStories({
  projectId,
  mvpScope,
  ideaContext,
}: FeatureUserStoriesProps) {
  const { blueprint, saveBlueprint, autosave, updateSectionCompletion } = useBuildBlueprint();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blueprint?.feature_specs?.features) {
      setFeatures(blueprint.feature_specs.features);
    } else if (mvpScope?.features) {
      // Initialize from MVP scope
      const initialFeatures: Feature[] = mvpScope.features
        .filter((f: any) => f.tier === "must" || f.tier === "should")
        .map((f: any) => ({
          id: f.id || `feature-${Date.now()}-${Math.random()}`,
          name: f.name || "",
          description: f.description || "",
          userStory: "",
          acceptanceCriteria: [],
          edgeCases: [],
          tier: f.tier || "must",
        }));
      setFeatures(initialFeatures);
    }
  }, [blueprint, mvpScope]);

  const toggleFeature = (id: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFeatures(newExpanded);
  };

  const handleUpdateFeature = (id: string, updates: Partial<Feature>) => {
    setFeatures(features.map(f => f.id === id ? { ...f, ...updates } : f));
    autosave({
      featureSpecs: {
        features: features.map(f => f.id === id ? { ...f, ...updates } : f),
      },
    });
  };

  const handleAddCriterion = (featureId: string) => {
    const newCriterion: AcceptanceCriterion = {
      id: `criterion-${Date.now()}-${Math.random()}`,
      text: "",
    };
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        acceptanceCriteria: [...feature.acceptanceCriteria, newCriterion],
      });
    }
  };

  const handleUpdateCriterion = (featureId: string, criterionId: string, text: string) => {
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        acceptanceCriteria: feature.acceptanceCriteria.map(c =>
          c.id === criterionId ? { ...c, text } : c
        ),
      });
    }
  };

  const handleDeleteCriterion = (featureId: string, criterionId: string) => {
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        acceptanceCriteria: feature.acceptanceCriteria.filter(c => c.id !== criterionId),
      });
    }
  };

  const handleAddEdgeCase = (featureId: string) => {
    const newEdgeCase: EdgeCase = {
      id: `edgecase-${Date.now()}-${Math.random()}`,
      text: "",
    };
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        edgeCases: [...feature.edgeCases, newEdgeCase],
      });
    }
  };

  const handleUpdateEdgeCase = (featureId: string, edgeCaseId: string, text: string) => {
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        edgeCases: feature.edgeCases.map(e =>
          e.id === edgeCaseId ? { ...e, text } : e
        ),
      });
    }
  };

  const handleDeleteEdgeCase = (featureId: string, edgeCaseId: string) => {
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      handleUpdateFeature(featureId, {
        edgeCases: feature.edgeCases.filter(e => e.id !== edgeCaseId),
      });
    }
  };

  const handleGenerateFeature = async (featureId: string) => {
    try {
      setGenerating(featureId);
      const feature = features.find(f => f.id === featureId);
      
      if (!feature) {
        console.error("[Features] Feature not found:", featureId);
        return;
      }

      console.log("[Features] Generating for feature:", feature.name);

      const response = await fetch("/api/build/features/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          featureName: feature.name,
          featureId: feature.id,
          featureDescription: feature.description,
          mvpScope,
          ideaContext,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate feature";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("[Features] API error:", errorData);
        } catch (parseError) {
          console.error("[Features] Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[Features] API response:", {
        hasResult: !!data.result,
        isArray: Array.isArray(data.result),
        resultKeys: data.result ? Object.keys(data.result) : [],
      });

      if (data.result) {
        const result = data.result;
        
        // Handle single feature result (not an array)
        if (!Array.isArray(result)) {
          const updatedFeature = {
            description: result.description || feature.description || "",
            userStory: result.userStory || result.user_story || "",
            acceptanceCriteria: (result.acceptanceCriteria || result.acceptance_criteria || []).map((c: any) => ({
              id: `criterion-${Date.now()}-${Math.random()}`,
              text: typeof c === "string" ? c : (c.text || c || ""),
            })).filter((c: any) => c.text), // Filter out empty criteria
            edgeCases: (result.edgeCases || result.edge_cases || []).map((e: any) => ({
              id: `edgecase-${Date.now()}-${Math.random()}`,
              text: typeof e === "string" ? e : (e.text || e || ""),
            })).filter((e: any) => e.text), // Filter out empty edge cases
            lastGeneratedAt: new Date().toISOString(),
          };

          console.log("[Features] Updating feature:", featureId, {
            criteriaCount: updatedFeature.acceptanceCriteria.length,
            edgeCasesCount: updatedFeature.edgeCases.length,
          });

          // Update only this specific feature
          handleUpdateFeature(featureId, updatedFeature);
        } else {
          // If array returned, find the matching feature by name
          const matchingResult = result.find((r: any) => r.name === feature.name);
          if (matchingResult) {
            const updatedFeature = {
              description: matchingResult.description || feature.description || "",
              userStory: matchingResult.userStory || matchingResult.user_story || "",
              acceptanceCriteria: (matchingResult.acceptanceCriteria || matchingResult.acceptance_criteria || []).map((c: any) => ({
                id: `criterion-${Date.now()}-${Math.random()}`,
                text: typeof c === "string" ? c : (c.text || c || ""),
              })).filter((c: any) => c.text),
              edgeCases: (matchingResult.edgeCases || matchingResult.edge_cases || []).map((e: any) => ({
                id: `edgecase-${Date.now()}-${Math.random()}`,
                text: typeof e === "string" ? e : (e.text || e || ""),
              })).filter((e: any) => e.text),
              lastGeneratedAt: new Date().toISOString(),
            };
            handleUpdateFeature(featureId, updatedFeature);
          } else {
            console.warn("[Features] No matching result found in array for feature:", feature.name);
          }
        }
      }
    } catch (error: any) {
      console.error("[Features] Generation error:", {
        error: error.message,
        stack: error.stack,
      });
      // Show error toast
      const { toast } = await import("sonner");
      toast.error(error.message || "Failed to generate feature. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating("all");
      const featuresToGenerate = features.filter(f => f.tier === "must" || f.tier === "should");
      
      if (featuresToGenerate.length === 0) {
        const { toast } = await import("sonner");
        toast.warning("No features found to generate. Please complete MVP Scope first.");
        return;
      }

      console.log("[Features] Generating all features:", featuresToGenerate.length);

      const response = await fetch("/api/build/features/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          allFeatures: featuresToGenerate.map(f => ({
            name: f.name,
            description: f.description,
          })),
          mvpScope,
          ideaContext,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate features";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("[Features] Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[Features] Bulk generation response:", {
        hasResult: !!data.result,
        isArray: Array.isArray(data.result),
        resultCount: Array.isArray(data.result) ? data.result.length : 0,
      });

      if (data.result && Array.isArray(data.result)) {
        // Update each feature with its corresponding result
        data.result.forEach((result: any, idx: number) => {
          const feature = featuresToGenerate[idx];
          if (feature && result) {
            const updatedFeature = {
              description: result.description || feature.description || "",
              userStory: result.userStory || result.user_story || "",
              acceptanceCriteria: (result.acceptanceCriteria || result.acceptance_criteria || []).map((c: any) => ({
                id: `criterion-${Date.now()}-${idx}-${Math.random()}`,
                text: typeof c === "string" ? c : (c.text || c || ""),
              })).filter((c: any) => c.text),
              edgeCases: (result.edgeCases || result.edge_cases || []).map((e: any) => ({
                id: `edgecase-${Date.now()}-${idx}-${Math.random()}`,
                text: typeof e === "string" ? e : (e.text || e || ""),
              })).filter((e: any) => e.text),
              lastGeneratedAt: new Date().toISOString(),
            };
            handleUpdateFeature(feature.id, updatedFeature);
          }
        });

        const { toast } = await import("sonner");
        toast.success(`Generated user stories for ${data.result.length} feature${data.result.length !== 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error("[Features] Bulk generation error:", {
        error: error.message,
        stack: error.stack,
      });
      const { toast } = await import("sonner");
      toast.error(error.message || "Failed to generate features. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const mustHaveFeatures = features.filter(f => f.tier === "must");
      const allMustHaveCriteria = mustHaveFeatures.every(f => f.acceptanceCriteria.length > 0);
      
      if (!allMustHaveCriteria) {
        alert("Please ensure all Must Have features have acceptance criteria before completing this section.");
        return;
      }

      await saveBlueprint({
        featureSpecs: {
          features,
        },
      });
      updateSectionCompletion("features", true);
    } catch (error) {
      console.error("Failed to save features:", error);
    } finally {
      setSaving(false);
    }
  };

  const mustHaveFeatures = features.filter(f => f.tier === "must");
  const shouldHaveFeatures = features.filter(f => f.tier === "should");

  return (
    <BuildSectionShell
      title="Features & User Stories"
      description="Define features with user stories, acceptance criteria, and edge cases"
      sectionId="features"
      onSave={handleSave}
      onAIGenerate={features.length > 0 ? handleGenerateAll : undefined}
      saving={saving}
      generating={generating === "all"}
      showLock={true}
    >
      <div className="space-y-4">
        {mustHaveFeatures.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-600">Must Have Features</h3>
            <div className="space-y-3">
              {mustHaveFeatures.map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  isExpanded={expandedFeatures.has(feature.id)}
                  onToggle={() => toggleFeature(feature.id)}
                  onUpdate={handleUpdateFeature}
                  onGenerate={() => handleGenerateFeature(feature.id)}
                  onAddCriterion={handleAddCriterion}
                  onUpdateCriterion={handleUpdateCriterion}
                  onDeleteCriterion={handleDeleteCriterion}
                  onAddEdgeCase={handleAddEdgeCase}
                  onUpdateEdgeCase={handleUpdateEdgeCase}
                  onDeleteEdgeCase={handleDeleteEdgeCase}
                  generating={generating === feature.id}
                />
              ))}
            </div>
          </div>
        )}

        {shouldHaveFeatures.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-yellow-600">Should Have Features</h3>
            <div className="space-y-3">
              {shouldHaveFeatures.map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  isExpanded={expandedFeatures.has(feature.id)}
                  onToggle={() => toggleFeature(feature.id)}
                  onUpdate={handleUpdateFeature}
                  onGenerate={() => handleGenerateFeature(feature.id)}
                  onAddCriterion={handleAddCriterion}
                  onUpdateCriterion={handleUpdateCriterion}
                  onDeleteCriterion={handleDeleteCriterion}
                  onAddEdgeCase={handleAddEdgeCase}
                  onUpdateEdgeCase={handleUpdateEdgeCase}
                  onDeleteEdgeCase={handleDeleteEdgeCase}
                  generating={generating === feature.id}
                />
              ))}
            </div>
          </div>
        )}

        {features.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-neutral-500">
              <p>No features found. Please complete the MVP Scope section first.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </BuildSectionShell>
  );
}

function FeatureCard({
  feature,
  isExpanded,
  onToggle,
  onUpdate,
  onGenerate,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  onAddEdgeCase,
  onUpdateEdgeCase,
  onDeleteEdgeCase,
  generating,
}: {
  feature: Feature;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, updates: Partial<Feature>) => void;
  onGenerate: () => void;
  onAddCriterion: (featureId: string) => void;
  onUpdateCriterion: (featureId: string, criterionId: string, text: string) => void;
  onDeleteCriterion: (featureId: string, criterionId: string) => void;
  onAddEdgeCase: (featureId: string) => void;
  onUpdateEdgeCase: (featureId: string, edgeCaseId: string, text: string) => void;
  onDeleteEdgeCase: (featureId: string, edgeCaseId: string) => void;
  generating: boolean;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{feature.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onGenerate();
              }}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={feature.description}
              onChange={(e) => onUpdate(feature.id, { description: e.target.value })}
              placeholder="Feature description"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium">User Story</label>
            <Textarea
              value={feature.userStory}
              onChange={(e) => onUpdate(feature.id, { userStory: e.target.value })}
              placeholder="As a [user], I want [action] so that [benefit]"
              rows={2}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Acceptance Criteria</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddCriterion(feature.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {feature.acceptanceCriteria.map(criterion => (
                <div key={criterion.id} className="flex items-center gap-2">
                  <Input
                    value={criterion.text}
                    onChange={(e) => onUpdateCriterion(feature.id, criterion.id, e.target.value)}
                    placeholder="Acceptance criterion"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCriterion(feature.id, criterion.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Edge Cases</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddEdgeCase(feature.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {feature.edgeCases.map(edgeCase => (
                <div key={edgeCase.id} className="flex items-center gap-2">
                  <Input
                    value={edgeCase.text}
                    onChange={(e) => onUpdateEdgeCase(feature.id, edgeCase.id, e.target.value)}
                    placeholder="Edge case"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteEdgeCase(feature.id, edgeCase.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

