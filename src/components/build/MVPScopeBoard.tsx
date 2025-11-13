"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, Plus, X, GripVertical, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface Feature {
  id: string;
  name: string;
  description?: string;
  tier: "must" | "should" | "future";
  notes?: string;
  aiGenerated?: boolean;
  aiRationale?: string;
}

interface MVPScopeBoardProps {
  projectId: string;
  ideaContext?: string;
  designData?: any;
}

export default function MVPScopeBoard({
  projectId,
  ideaContext,
  designData,
}: MVPScopeBoardProps) {
  const { blueprint, saveBlueprint, autosave, updateSectionCompletion, buildPath } = useBuildBlueprint();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedFeature, setDraggedFeature] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (blueprint?.mvp_scope?.features) {
      setFeatures(blueprint.mvp_scope.features);
    } else if (designData?.mvp_definition) {
      // Initialize from design MVP data
      const mvpData = designData.mvp_definition;
      const initialFeatures: Feature[] = [];
      
      if (mvpData.mvpFeatureList) {
        const lines = mvpData.mvpFeatureList.split("\n").filter((l: string) => l.trim());
        lines.forEach((line: string) => {
          if (line.trim() && !line.startsWith("#")) {
            initialFeatures.push({
              id: `feature-${Date.now()}-${Math.random()}`,
              name: line.replace(/^[-*]\s*/, "").trim(),
              tier: "must",
            });
          }
        });
      }
      
      if (initialFeatures.length > 0) {
        setFeatures(initialFeatures);
      }
    }
  }, [blueprint, designData]);

  const handleAddFeature = (tier: "must" | "should" | "future") => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}-${Math.random()}`,
      name: "",
      tier,
    };
    setFeatures([...features, newFeature]);
  };

  const handleUpdateFeature = (id: string, updates: Partial<Feature>) => {
    const updatedFeatures = features.map(f => f.id === id ? { ...f, ...updates } : f);
    setFeatures(updatedFeatures);
    
    // Clear existing autosave timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    // Set new autosave timer
    autosaveTimerRef.current = setTimeout(() => {
      autosave({
        mvpScope: {
          features: updatedFeatures,
        },
      });
    }, 1000);
  };

  const handleDeleteFeature = (id: string) => {
    const updated = features.filter(f => f.id !== id);
    setFeatures(updated);
    
    // Clear autosave timer and save immediately
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    autosave({
      mvpScope: {
        features: updated,
      },
    });
  };

  const handleMoveFeature = (id: string, newTier: "must" | "should" | "future") => {
    const updatedFeatures = features.map(f => f.id === id ? { ...f, tier: newTier } : f);
    setFeatures(updatedFeatures);
    
    // Clear autosave timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    // Autosave on tier change
    autosaveTimerRef.current = setTimeout(() => {
      autosave({
        mvpScope: {
          features: updatedFeatures,
        },
      });
    }, 500);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, featureId: string) => {
    setDraggedFeature(featureId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTier: "must" | "should" | "future") => {
    e.preventDefault();
    if (draggedFeature) {
      handleMoveFeature(draggedFeature, targetTier);
      setDraggedFeature(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedFeature(null);
  };

  const handleSuggestScope = async () => {
    try {
      setGenerating(true);
      console.log("[MVP Scope] Starting AI generation...", {
        projectId,
        currentFeaturesCount: features.length,
        hasDesignData: !!designData,
        hasIdeaContext: !!ideaContext,
        buildPath,
      });

      const response = await fetch("/api/build/scope/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          designData,
          ideaContext,
          currentFeatures: features, // Send current features to avoid duplicates
          buildPath,
        }),
      });

      console.log("[MVP Scope] API response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to generate suggestions";
        let errorCode = "UNKNOWN_ERROR";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code || errorCode;
          console.error("[MVP Scope] API error response:", errorData);
        } catch (parseError) {
          console.error("[MVP Scope] Failed to parse error response:", parseError);
          errorMessage = `Server error (${response.status}). Please try again.`;
        }

        // Handle specific error codes
        if (errorCode === "MISSING_AI_CONFIG") {
          errorMessage = "AI configuration not found. Please contact support or check that Build prompts are seeded.";
        } else if (errorCode === "MISSING_PROJECT_ID") {
          errorMessage = "Project ID is missing. Please refresh the page.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[MVP Scope] API response data:", {
        hasResult: !!data.result,
        hasFeatures: !!data.result?.features,
        featuresCount: data.result?.features?.length || 0,
        resultKeys: data.result ? Object.keys(data.result) : [],
      });

      // Handle different response structures
      let featuresArray: any[] = [];
      
      if (data.result) {
        if (Array.isArray(data.result.features)) {
          featuresArray = data.result.features;
        } else if (Array.isArray(data.result)) {
          // If result itself is an array
          featuresArray = data.result;
        } else if (data.result.error) {
          throw new Error(data.result.error);
        }
      }

      if (featuresArray.length === 0) {
        console.warn("[MVP Scope] No features returned from AI");
        toast.warning("AI generated no new features. Try adjusting your project context or try again.");
        return;
      }

      const suggestedFeatures: Feature[] = featuresArray.map((f: any, idx: number) => ({
        id: `suggested-${Date.now()}-${idx}`,
        name: f.name || f.title || `Feature ${idx + 1}`,
        description: f.description || "",
        tier: (f.tier === "must" || f.tier === "should" || f.tier === "future") 
          ? f.tier 
          : "should",
        notes: f.notes || "",
        aiGenerated: true,
        aiRationale: f.rationale || f.notes || "AI suggested based on your project context",
      }));

      console.log("[MVP Scope] Processed suggested features:", suggestedFeatures.length);

      // Merge with existing features (don't wipe manual entries)
      const mergedFeatures = [...features, ...suggestedFeatures];
      setFeatures(mergedFeatures);
      
      // Autosave the merged features
      autosave({
        mvpScope: {
          features: mergedFeatures,
        },
      });
      
      toast.success(`Added ${suggestedFeatures.length} AI-suggested feature${suggestedFeatures.length !== 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error("[MVP Scope] Generation error:", {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Show user-friendly error message
      const errorMessage = error.message || "Failed to generate AI suggestions. Please check your connection and try again.";
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveBlueprint({
        mvpScope: {
          features,
        },
      });
      updateSectionCompletion("mvp_scope", true);
      toast.success("MVP Scope saved successfully");
    } catch (error: any) {
      console.error("Failed to save MVP scope:", error);
      toast.error(error.message || "Failed to save MVP scope. Please try again.");
      throw error; // Re-throw to allow retry
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    // Confirm before resetting
    const confirmed = window.confirm(
      "Are you sure you want to reset all features? This will clear all features from Must Have, Should Have, and Future columns. This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      // Clear all features
      setFeatures([]);
      
      // Clear autosave timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      // Save empty state immediately
      await saveBlueprint({
        mvpScope: {
          features: [],
        },
      });

      // Reset section completion
      updateSectionCompletion("mvp_scope", false);

      toast.success("MVP Scope reset successfully. You can now start fresh.");
    } catch (error: any) {
      console.error("Failed to reset MVP scope:", error);
      toast.error(error.message || "Failed to reset MVP scope. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const mustHaveFeatures = features.filter(f => f.tier === "must");
  const shouldHaveFeatures = features.filter(f => f.tier === "should");
  const futureFeatures = features.filter(f => f.tier === "future");

  const FeatureCard = ({ feature }: { feature: Feature }) => (
    <Card 
      className={cn(
        "mb-2 transition-all",
        draggedFeature === feature.id && "opacity-50",
        feature.aiGenerated && "border-purple-200 bg-purple-50/30"
      )}
      draggable
      onDragStart={(e) => handleDragStart(e, feature.id)}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-2">
          <div 
            className="cursor-move text-neutral-400 hover:text-neutral-600"
            title="Drag to move between columns"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={feature.name}
                onChange={(e) => handleUpdateFeature(feature.id, { name: e.target.value })}
                placeholder="Feature name"
                className="font-medium flex-1"
              />
              {feature.aiGenerated && (
                <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  <Sparkles className="h-3 w-3" />
                  <span>AI</span>
                </div>
              )}
            </div>
            {feature.description !== undefined && (
              <Textarea
                value={feature.description || ""}
                onChange={(e) => handleUpdateFeature(feature.id, { description: e.target.value })}
                placeholder="Description"
                rows={2}
              />
            )}
            <Textarea
              value={feature.notes || ""}
              onChange={(e) => handleUpdateFeature(feature.id, { notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={1}
              className="text-sm"
            />
            {feature.aiRationale && feature.aiGenerated && (
              <div className="text-xs text-neutral-500 italic bg-neutral-50 p-2 rounded">
                {feature.aiRationale}
              </div>
            )}
            <div className="flex items-center gap-2">
              <select
                value={feature.tier}
                onChange={(e) => handleMoveFeature(feature.id, e.target.value as any)}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="must">Must Have</option>
                <option value="should">Should Have</option>
                <option value="future">Future</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFeature(feature.id)}
                className="text-red-600 hover:text-red-700"
                title="Delete feature"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const Column = ({ title, tier, features: tierFeatures, color }: {
    title: string;
    tier: "must" | "should" | "future";
    features: Feature[];
    color: string;
  }) => (
    <div 
      className="flex-1 space-y-2"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, tier)}
    >
      <div className={cn("p-3 rounded-lg border-2", color)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-neutral-600 bg-white px-2 py-1 rounded">
            {tierFeatures.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddFeature(tier)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Feature
        </Button>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {tierFeatures.length === 0 ? (
          <div className="text-center text-neutral-400 text-sm py-8 border-2 border-dashed rounded">
            Drop features here or click "Add Feature"
          </div>
        ) : (
          tierFeatures.map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <BuildSectionShell
      title="MVP Scope"
      description="Organize features by priority tier: Must Have, Should Have, and Future"
      sectionId="mvp_scope"
      onSave={handleSave}
      onAIGenerate={handleSuggestScope}
      saving={saving}
      generating={generating}
      showLock={true}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-neutral-600">
          {features.length > 0 && (
            <span>{features.length} feature{features.length !== 1 ? 's' : ''} total</span>
          )}
        </div>
        {features.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving || generating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        <Column
          title="Must Have"
          tier="must"
          features={mustHaveFeatures}
          color="border-red-200 bg-red-50"
        />
        <Column
          title="Should Have"
          tier="should"
          features={shouldHaveFeatures}
          color="border-yellow-200 bg-yellow-50"
        />
        <Column
          title="Future"
          tier="future"
          features={futureFeatures}
          color="border-blue-200 bg-blue-50"
        />
      </div>
    </BuildSectionShell>
  );
}

