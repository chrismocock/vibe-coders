"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Loader2, Download, Copy, CheckCircle2 } from "lucide-react";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface DeveloperPackProps {
  projectId: string;
  buildPath?: string;
  ideaContext?: string;
}

export default function DeveloperPack({
  projectId,
  buildPath,
  ideaContext,
}: DeveloperPackProps) {
  const { blueprint, saveBlueprint, updateSectionCompletion } = useBuildBlueprint();
  const [pack, setPack] = useState<any>(null);
  const [compiling, setCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (blueprint?.developer_pack) {
      setPack(blueprint.developer_pack);
    }
  }, [blueprint]);

  const handleCompile = async () => {
    try {
      setCompiling(true);
      const response = await fetch("/api/build/developer-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          buildPath,
          blueprintData: blueprint,
          ideaContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPack(data.result);
        await saveBlueprint({
          developerPack: data.result,
        });
        updateSectionCompletion("developer_pack", true);
      }
    } catch (error) {
      console.error("Failed to compile pack:", error);
    } finally {
      setCompiling(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPackContent = (format: "ai_tool" | "hire_dev" | "advanced") => {
    if (!pack) return "";
    
    if (format === "ai_tool" && pack.aiTool) {
      return typeof pack.aiTool === "string" ? pack.aiTool : JSON.stringify(pack.aiTool, null, 2);
    }
    if (format === "hire_dev" && pack.hireDev) {
      return typeof pack.hireDev === "string" ? pack.hireDev : JSON.stringify(pack.hireDev, null, 2);
    }
    if (format === "advanced" && pack.advanced) {
      return typeof pack.advanced === "string" ? pack.advanced : JSON.stringify(pack.advanced, null, 2);
    }
    
    // Fallback to markdown
    return pack.markdown || "";
  };

  return (
    <BuildSectionShell
      title="Developer Pack"
      description="Compile all build data into formats ready for development"
      sectionId="developer_pack"
      onAIGenerate={handleCompile}
      generating={compiling}
      showLock={true}
    >
      <div className="space-y-6">
        {!pack ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-neutral-600 mb-4">
                Compile your developer pack to generate AI tool prompts, PRD, or advanced blueprint.
              </p>
              <Button onClick={handleCompile} disabled={compiling}>
                {compiling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Compile Pack
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={buildPath === "ai_tool" ? "ai_tool" : buildPath === "hire_dev" ? "hire_dev" : "advanced"}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai_tool">AI Tool</TabsTrigger>
              <TabsTrigger value="hire_dev">Hire Dev</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai_tool" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>AI Tool Prompts</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(getPackContent("ai_tool"))}
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(getPackContent("ai_tool"), "ai-tool-prompts.md")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-neutral-50 p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                    {getPackContent("ai_tool")}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hire_dev" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>PRD for Developers</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(getPackContent("hire_dev"))}
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(getPackContent("hire_dev"), "prd.md")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-neutral-50 p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                    {getPackContent("hire_dev")}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Advanced Blueprint</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(getPackContent("advanced"))}
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(getPackContent("advanced"), "blueprint.md")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-neutral-50 p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                    {getPackContent("advanced")}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </BuildSectionShell>
  );
}

