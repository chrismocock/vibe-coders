"use client";

import { useParams } from "next/navigation";
import DesignOverviewHub from "@/components/design/DesignOverviewHub";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DesignOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [ideaContext, setIdeaContext] = useState<string>("");
  const [validateData, setValidateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

              const overview = outputData.overview || outputData.aiProductOverview;
              if (overview) {
                setValidateData(overview);
                const overviewText = typeof overview === "string" ? overview : JSON.stringify(overview);
                setIdeaContext(overviewText);
                return;
              }

              const reportId = outputData.reportId;
              if (reportId) {
                const reportResponse = await fetch(`/api/validate/${reportId}`);
                if (reportResponse.ok) {
                  const reportData = await reportResponse.json();
                  setValidateData(reportData.report);
                  setIdeaContext(reportData.report);
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
        <span className="ml-2 text-neutral-600">Loading design overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Design Overview</h1>
        <p className="text-neutral-600">
          Complete all 8 sections to finalize your design blueprint. Use AI generation to speed up the process.
        </p>
      </div>

      <DesignOverviewHub
        projectId={projectId}
        ideaContext={ideaContext}
        validateData={validateData}
      />
    </div>
  );
}

