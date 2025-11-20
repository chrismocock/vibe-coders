"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, CheckCircle2, Plus, X } from "lucide-react";

interface KeyScreen {
  id: string;
  name: string;
  description: string;
  wireframeSummary: string;
  imageUrl?: string;
}

interface WireframesLayoutsProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

export default function WireframesLayouts({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: WireframesLayoutsProps) {
  const [wireframeSummary, setWireframeSummary] = useState("");
  const [keyScreens, setKeyScreens] = useState<KeyScreen[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.wireframes) {
      const data = blueprint.wireframes;
      setWireframeSummary(data.wireframeSummary || "");
      // Ensure all screens have IDs
      const screens = (data.keyScreens || []).map((screen: any, index: number) => ({
        ...screen,
        id: screen.id || `${Date.now()}-${index}`,
      }));
      setKeyScreens(screens);
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeKeyScreen(screen: any, index: number): KeyScreen {
    return {
      id: screen.id || `${Date.now()}-${index}`,
      name: screen.name || screen.screenName || "",
      description: screen.description || screen.desc || "",
      wireframeSummary: screen.wireframeSummary || screen.wireframe || screen.summary || "",
      imageUrl: screen.imageUrl || screen.image_url || undefined,
    };
  }

  function normalizeWireframesData(data: any): {
    wireframeSummary: string;
    keyScreens: KeyScreen[];
  } {
    // Handle different field name variations
    const wireframeSummary = data.wireframeSummary || data.wireframe_summary || data.summary || "";
    const keyScreensRaw = data.keyScreens || data.key_screens || data.screens || [];

    // Normalize keyScreens array
    let keyScreens: KeyScreen[] = [];
    if (Array.isArray(keyScreensRaw)) {
      keyScreens = keyScreensRaw.map((screen, index) => normalizeKeyScreen(screen, index));
    } else if (typeof keyScreensRaw === "object" && keyScreensRaw !== null) {
      // If it's a single object, wrap it in an array
      keyScreens = [normalizeKeyScreen(keyScreensRaw, 0)];
    }

    return {
      wireframeSummary: typeof wireframeSummary === "string" ? wireframeSummary : JSON.stringify(wireframeSummary),
      keyScreens,
    };
  }

  function parseWireframesFromAI(result: any): {
    wireframeSummary: string;
    keyScreens: KeyScreen[];
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeWireframesData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeWireframesData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseWireframesFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      wireframeSummary: "",
      keyScreens: [],
    };
  }

  function parseWireframesFromMarkdown(text: string): {
    wireframeSummary: string;
    keyScreens: KeyScreen[];
  } {
    const keyScreens: KeyScreen[] = [];
    
    // Extract wireframe summary
    const summaryMatch = text.match(/\*\*[Ww]ireframe [Ss]ummary\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const summaryHeader = text.match(/##\s*[Ww]ireframe [Ss]ummary\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const wireframeSummary = (summaryMatch?.[1] || summaryHeader?.[1] || "").trim();

    // Try to extract screens from markdown
    // Look for screen sections (## Screen Name or **Screen Name**)
    const screenMatches = text.matchAll(/##\s*([^\n]+)\s*\n([\s\S]*?)(?=##|$)/g);
    for (const match of screenMatches) {
      const screenName = match[1].trim();
      const content = match[2].trim();
      
      // Skip if it's the summary section
      if (screenName.toLowerCase().includes("summary") || screenName.toLowerCase().includes("wireframe")) {
        continue;
      }
      
      const descriptionMatch = content.match(/\*\*[Dd]escription\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
      const wireframeMatch = content.match(/\*\*[Ww]ireframe [Ss]ummary\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/);
      
      keyScreens.push({
        id: `${Date.now()}-${keyScreens.length}`,
        name: screenName,
        description: descriptionMatch?.[1]?.trim() || "",
        wireframeSummary: wireframeMatch?.[1]?.trim() || content.trim(),
      });
    }

    return {
      wireframeSummary,
      keyScreens,
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
          section: "wireframes",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseWireframesFromAI(result);
        
        // Update state
        setWireframeSummary(generatedData.wireframeSummary);
        setKeyScreens(generatedData.keyScreens);
        
        // Save with the generated data directly
        await saveDataWithWireframes(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function generateScreenWireframe(screenId: string) {
    try {
      const screen = keyScreens.find((s) => s.id === screenId);
      if (!screen) return;

      setGenerating(true);
      const response = await fetch("/api/design/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          section: "wireframes",
          ideaContext,
          validateData,
          screenName: screen.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Parse the result - could be string or object
        let wireframeText = "";
        if (typeof result === "string") {
          wireframeText = result;
        } else if (typeof result === "object" && result !== null) {
          wireframeText = result.wireframeSummary || result.wireframe || result.summary || "";
        }
        
        // Update the specific screen
        const updatedScreens = keyScreens.map((s) =>
          s.id === screenId ? { ...s, wireframeSummary: wireframeText } : s
        );
        setKeyScreens(updatedScreens);
        
        // Save with updated screens
        await saveDataWithWireframes({
          wireframeSummary,
          keyScreens: updatedScreens,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      wireframeSummary,
      keyScreens,
    };
    return saveDataWithWireframes(data);
  }

  async function saveDataWithWireframes(data: {
    wireframeSummary: string;
    keyScreens: KeyScreen[];
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          wireframes: data,
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

  function addScreen() {
    const newScreen: KeyScreen = {
      id: Date.now().toString(),
      name: "",
      description: "",
      wireframeSummary: "",
    };
    setKeyScreens([...keyScreens, newScreen]);
  }

  function removeScreen(id: string) {
    setKeyScreens(keyScreens.filter((s) => s.id !== id));
  }

  function updateScreen(id: string, field: keyof KeyScreen, value: string) {
    setKeyScreens(
      keyScreens.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  const hasData = wireframeSummary || keyScreens.length > 0;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Wireframes & Layouts
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Define screen layouts and wireframe descriptions
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
            Wireframe Summary
          </label>
          <Textarea
            value={wireframeSummary}
            onChange={(e) => setWireframeSummary(e.target.value)}
            placeholder="Overall wireframe approach and key design principles..."
            className="min-h-[120px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700">
              Key Screens
            </label>
            <Button onClick={addScreen} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Screen
            </Button>
          </div>

          {keyScreens.map((screen) => (
            <Card key={screen.id} className="border border-neutral-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={screen.name}
                    onChange={(e) => updateScreen(screen.id, "name", e.target.value)}
                    placeholder="Screen Name"
                    className="font-semibold"
                    onBlur={saveData}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScreen(screen.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">Description</label>
                  <Textarea
                    value={screen.description}
                    onChange={(e) => updateScreen(screen.id, "description", e.target.value)}
                    placeholder="What is this screen for?"
                    className="min-h-[60px] text-sm"
                    onBlur={saveData}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700">Wireframe Summary</label>
                  <Textarea
                    value={screen.wireframeSummary}
                    onChange={(e) => updateScreen(screen.id, "wireframeSummary", e.target.value)}
                    placeholder="Describe the layout, components, and interactions..."
                    className="min-h-[100px] text-sm"
                    onBlur={saveData}
                  />
                </div>
                <Button
                  onClick={() => generateScreenWireframe(screen.id)}
                  disabled={generating || !screen.name}
                  variant="outline"
                  size="sm"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Wireframe for {screen.name || "Screen"}
                </Button>
              </CardContent>
            </Card>
          ))}
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
                Generate Wireframes
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

