"use client";

import { useParams } from "next/navigation";
import BuildOverviewHub from "@/components/build/BuildOverviewHub";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Users, Code } from "lucide-react";
import { useRouter } from "next/navigation";

const BUILD_PATHS = [
  {
    id: "ai_tool",
    label: "AI Tool",
    description: "Build it yourself with AI assistance",
    icon: Rocket,
    details: "Get prompts and guidance for Cursor, v0.dev, Bolt.new, and other AI coding tools.",
  },
  {
    id: "hire_dev",
    label: "Hire Dev",
    description: "Create a PRD for external developers",
    icon: Users,
    details: "Generate a comprehensive Product Requirements Document for hiring developers.",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Full technical blueprint",
    icon: Code,
    details: "Complete technical specifications for experienced development teams.",
  },
];

export default function BuildOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { blueprint, loading, buildPath, saveBlueprint, refreshBlueprint } = useBuildBlueprint();
  const [ideaContext, setIdeaContext] = useState<string>("");
  const [designData, setDesignData] = useState<any>(null);
  const [validateData, setValidateData] = useState<any>(null);
  const [selectingPath, setSelectingPath] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load ideate data for context
        const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const ideateStage = stagesData.stages?.find(
            (s: any) => s.stage === "ideate" && s.status === "completed"
          );
          
          if (ideateStage?.input) {
            try {
              const parsed = JSON.parse(ideateStage.input);
              const selectedIdea = parsed.selectedIdea;
              const context = selectedIdea && typeof selectedIdea === "object" && selectedIdea !== null
                ? selectedIdea.title || selectedIdea.description || JSON.stringify(selectedIdea)
                : selectedIdea || "";
              setIdeaContext(context);
            } catch (e) {
              console.error("Failed to parse ideate data:", e);
            }
          }

          // Load validation data
          const validateStage = stagesData.stages?.find(
            (s: any) => s.stage === "validate" && s.status === "completed"
          );
          
          if (validateStage?.output) {
            try {
              const outputData = typeof validateStage.output === "string"
                ? JSON.parse(validateStage.output)
                : validateStage.output;
              
              const reportId = outputData.reportId;
              if (reportId) {
                const reportResponse = await fetch(`/api/validate/${reportId}`);
                if (reportResponse.ok) {
                  const reportData = await reportResponse.json();
                  setValidateData(reportData.report);
                }
              }
            } catch (e) {
              console.error("Failed to load validation data:", e);
            }
          }
        }

        // Load design data
        const designResponse = await fetch(`/api/design/blueprint?projectId=${projectId}`);
        if (designResponse.ok) {
          const designData = await designResponse.json();
          setDesignData(designData.blueprint);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  const handlePathSelect = async (pathId: string) => {
    try {
      setSelectingPath(true);
      await saveBlueprint({ buildPath: pathId });
      
      // Update project stage to in_progress
      await fetch(`/api/projects/${projectId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "build",
          input: JSON.stringify({ buildPath: pathId }),
          status: "in_progress",
        }),
      });

      await refreshBlueprint();
    } catch (error) {
      console.error("Failed to save build path:", error);
    } finally {
      setSelectingPath(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">Loading build overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Build Overview</h1>
        <p className="text-neutral-600">
          {buildPath
            ? "Complete all 6 sections to finalize your build blueprint. Use AI generation to speed up the process."
            : "Select your build path to get started with customized guidance."}
        </p>
      </div>

      {!buildPath ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Build Path</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-6">
              Select how you want to build your product to receive customized guidance and prompts.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {BUILD_PATHS.map((path) => {
                const Icon = path.icon;
                return (
                  <Card
                    key={path.id}
                    className="cursor-pointer hover:border-purple-300 transition-all hover:shadow-md"
                    onClick={() => handlePathSelect(path.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Icon className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">{path.label}</CardTitle>
                      </div>
                      <p className="text-sm text-neutral-600">{path.description}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-neutral-500">{path.details}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {selectingPath && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-neutral-600">Saving selection...</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <BuildOverviewHub
          projectId={projectId}
          ideaContext={ideaContext}
          designData={designData}
          validateData={validateData}
        />
      )}
    </div>
  );
}
