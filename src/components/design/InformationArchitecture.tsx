"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, CheckCircle2, Download } from "lucide-react";

interface InformationArchitectureProps {
  projectId: string;
  blueprint?: any;
  ideaContext?: string;
  validateData?: any;
  onUpdate?: (data: any) => void;
}

export default function InformationArchitecture({
  projectId,
  blueprint,
  ideaContext,
  validateData,
  onUpdate,
}: InformationArchitectureProps) {
  const [siteMap, setSiteMap] = useState("");
  const [navigationFlow, setNavigationFlow] = useState("");
  const [contentGroups, setContentGroups] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Only update if we have new data, don't clear if blueprint becomes null
    if (blueprint?.information_architecture) {
      const data = blueprint.information_architecture;
      setSiteMap(data.siteMap || "");
      setNavigationFlow(data.navigationFlow || "");
      setContentGroups(data.contentGroups || "");
    }
    // Don't clear fields if blueprint is null - preserve existing state
  }, [blueprint]);

  function normalizeInformationArchitectureData(data: any): {
    siteMap: string;
    navigationFlow: string;
    contentGroups: string;
  } {
    // Handle different field name variations
    const siteMap = data.siteMap || data.site_map || data.sitemap || "";
    const navigationFlow = data.navigationFlow || data.navigation_flow || data.navFlow || "";
    const contentGroups = data.contentGroups || data.content_groups || data.contentGroupsList || "";

    return {
      siteMap: typeof siteMap === "string" ? siteMap : JSON.stringify(siteMap),
      navigationFlow: typeof navigationFlow === "string" ? navigationFlow : JSON.stringify(navigationFlow),
      contentGroups: typeof contentGroups === "string" ? contentGroups : JSON.stringify(contentGroups),
    };
  }

  function parseInformationArchitectureFromAI(result: any): {
    siteMap: string;
    navigationFlow: string;
    contentGroups: string;
  } {
    // If it's already an object with the correct structure
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
      return normalizeInformationArchitectureData(result);
    }

    // If it's a string, try to parse it
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return normalizeInformationArchitectureData(parsed);
        }
      } catch {
        // If JSON parsing fails, try to extract from markdown
        return parseInformationArchitectureFromMarkdown(result);
      }
    }

    // Fallback: return empty structure
    return {
      siteMap: "",
      navigationFlow: "",
      contentGroups: "",
    };
  }

  function parseInformationArchitectureFromMarkdown(text: string): {
    siteMap: string;
    navigationFlow: string;
    contentGroups: string;
  } {
    // Extract fields using common markdown patterns
    const siteMapMatch = text.match(/\*\*[Ss]ite [Mm]ap\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const navigationFlowMatch = text.match(/\*\*[Nn]avigation [Ff]low\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    const contentGroupsMatch = text.match(/\*\*[Cc]ontent [Gg]roups\*\*[:\-]?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/);
    
    // Also try header patterns
    const siteMapHeader = text.match(/##\s*[Ss]ite [Mm]ap\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const navigationFlowHeader = text.match(/##\s*[Nn]avigation [Ff]low\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);
    const contentGroupsHeader = text.match(/##\s*[Cc]ontent [Gg]roups\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/);

    return {
      siteMap: (siteMapMatch?.[1] || siteMapHeader?.[1] || "").trim(),
      navigationFlow: (navigationFlowMatch?.[1] || navigationFlowHeader?.[1] || "").trim(),
      contentGroups: (contentGroupsMatch?.[1] || contentGroupsHeader?.[1] || "").trim(),
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
          section: "information_architecture",
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Use improved parsing function
        const generatedData = parseInformationArchitectureFromAI(result);
        
        // Update state
        setSiteMap(generatedData.siteMap);
        setNavigationFlow(generatedData.navigationFlow);
        setContentGroups(generatedData.contentGroups);
        
        // Save with the generated data directly
        await saveDataWithArchitecture(generatedData);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveData() {
    const data = {
      siteMap,
      navigationFlow,
      contentGroups,
    };
    return saveDataWithArchitecture(data);
  }

  async function saveDataWithArchitecture(data: {
    siteMap: string;
    navigationFlow: string;
    contentGroups: string;
  }) {
    try {
      setSaving(true);

      const response = await fetch("/api/design/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          informationArchitecture: data,
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

  function exportAsMermaid() {
    // Convert siteMap to Mermaid format
    let mermaid = "graph TD\n";
    if (siteMap) {
      const lines = siteMap.split("\n").filter((l) => l.trim());
      lines.forEach((line, index) => {
        const indent = line.match(/^\s*/)?.[0].length || 0;
        const text = line.trim();
        if (text) {
          const nodeId = `A${index}`;
          mermaid += `${"  ".repeat(Math.floor(indent / 2))}${nodeId}[${text}]\n`;
        }
      });
    }
    
    const blob = new Blob([mermaid], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.mmd";
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasData = siteMap || navigationFlow || contentGroups;

  return (
    <Card className="border border-neutral-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Information Architecture
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Define site map, navigation flow, and content groups
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
            Site Map
          </label>
          <Textarea
            value={siteMap}
            onChange={(e) => setSiteMap(e.target.value)}
            placeholder="List all pages and sections in your site map..."
            className="min-h-[150px] font-mono text-sm"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Navigation Flow
          </label>
          <Textarea
            value={navigationFlow}
            onChange={(e) => setNavigationFlow(e.target.value)}
            placeholder="Describe how users navigate through your product..."
            className="min-h-[120px]"
            onBlur={saveData}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Content Groups
          </label>
          <Textarea
            value={contentGroups}
            onChange={(e) => setContentGroups(e.target.value)}
            placeholder="Group related content and features..."
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
                Generate Navigation Tree
              </>
            )}
          </Button>
          {siteMap && (
            <Button
              onClick={exportAsMermaid}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as Mermaid
            </Button>
          )}
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

