"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, CheckCircle2 } from "lucide-react";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface Screen {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  states?: string[];
  actions?: string[];
  components?: string[];
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

interface ScreensAndComponentsProps {
  projectId: string;
  designData?: any;
  featureSpecs?: any;
  ideaContext?: string;
}

export default function ScreensAndComponents({
  projectId,
  designData,
  featureSpecs,
  ideaContext,
}: ScreensAndComponentsProps) {
  const { blueprint, saveBlueprint, autosave, updateSectionCompletion } = useBuildBlueprint();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blueprint?.screens_components) {
      setScreens(blueprint.screens_components.screens || []);
      setChecklist(blueprint.screens_components.checklist || []);
    } else if (designData?.wireframes?.keyScreens) {
      // Initialize from design wireframes
      const initialScreens: Screen[] = designData.wireframes.keyScreens.map((s: any, idx: number) => ({
        id: `screen-${idx}`,
        name: s.name || "",
        description: s.wireframeSummary || s.description || "",
      }));
      setScreens(initialScreens);
    }
  }, [blueprint, designData]);

  const handleUpdateScreen = (id: string, updates: Partial<Screen>) => {
    setScreens(screens.map(s => s.id === id ? { ...s, ...updates } : s));
    autosave({
      screensComponents: {
        screens: screens.map(s => s.id === id ? { ...s, ...updates } : s),
        checklist,
      },
    });
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
    autosave({
      screensComponents: {
        screens,
        checklist: checklist.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      },
    });
  };

  const handleGenerateChecklist = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/build/screens/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          designData,
          featureSpecs,
          ideaContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const items = Array.isArray(data.result.checklist) 
            ? data.result.checklist 
            : Array.isArray(data.result) 
            ? data.result 
            : [];
          setChecklist(items.map((item: any, idx: number) => ({
            id: `checklist-${idx}`,
            text: typeof item === "string" ? item : item.text || item.name || "",
            completed: false,
            category: typeof item === "object" ? item.category || "general" : "general",
          })));
        }
      }
    } catch (error) {
      console.error("Failed to generate checklist:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveBlueprint({
        screensComponents: {
          screens,
          checklist,
        },
      });
      updateSectionCompletion("screens", true);
    } catch (error) {
      console.error("Failed to save screens:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BuildSectionShell
      title="Screens & Components"
      description="Map screens from design and create a build checklist"
      sectionId="screens"
      onSave={handleSave}
      onAIGenerate={handleGenerateChecklist}
      saving={saving}
      generating={generating}
      showLock={true}
    >
      <div className="space-y-6">
        {/* Screens */}
        <Card>
          <CardHeader>
            <CardTitle>Screens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {screens.map(screen => (
              <Card key={screen.id} className="border">
                <CardHeader>
                  <Input
                    value={screen.name}
                    onChange={(e) => handleUpdateScreen(screen.id, { name: e.target.value })}
                    placeholder="Screen name"
                    className="font-medium"
                  />
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={screen.description || ""}
                    onChange={(e) => handleUpdateScreen(screen.id, { description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Build Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded hover:bg-neutral-50 cursor-pointer"
                onClick={() => handleToggleChecklist(item.id)}
              >
                <div className={item.completed ? "text-green-600" : "text-neutral-400"}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className={item.completed ? "line-through text-neutral-500" : ""}>
                  {item.text}
                </span>
              </div>
            ))}
            {checklist.length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                Generate a checklist to get started
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </BuildSectionShell>
  );
}

