"use client";

import { useParams } from "next/navigation";
import WireframesLayouts from "@/components/design/WireframesLayouts";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function WireframesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [blueprint, setBlueprint] = useState<any>(null);
  const [ideaContext, setIdeaContext] = useState<string>("");
  const [validateData, setValidateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const blueprintResponse = await fetch(`/api/design/blueprint?projectId=${projectId}`);
        if (blueprintResponse.ok) {
          const data = await blueprintResponse.json();
          setBlueprint(data.blueprint);
        }

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
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Wireframes & Layouts</h1>
        <p className="text-neutral-600">
          Define screen layouts and wireframe descriptions
        </p>
      </div>

      <WireframesLayouts
        projectId={projectId}
        blueprint={blueprint}
        ideaContext={ideaContext}
        validateData={validateData}
        onUpdate={(updatedBlueprint) => {
          // Use the blueprint from save response directly, or refetch if not provided
          if (updatedBlueprint) {
            setBlueprint(updatedBlueprint);
          } else {
            // Fallback: refetch if blueprint not provided
            fetch(`/api/design/blueprint?projectId=${projectId}`)
              .then((response) => {
                if (response.ok) {
                  return response.json();
                }
                return null;
              })
              .then((data) => {
                if (data?.blueprint) {
                  setBlueprint(data.blueprint);
                }
              })
              .catch((error) => {
                console.error("Failed to refetch blueprint:", error);
                // Preserve existing blueprint state on error
              });
          }
        }}
      />
    </div>
  );
}

