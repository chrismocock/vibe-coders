"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import DesignWizard from "@/components/design/DesignWizard";

export default function DesignWizardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [ideaContext, setIdeaContext] = useState<string>("");
  const [validateData, setValidateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stagesResponse = await fetch(`/api/projects/${projectId}/stages`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const ideateStage = stagesData.stages?.find(
            (s: any) => s.stage === "ideate" && s.status === "completed"
          );

          if (ideateStage?.input) {
            try {
              const parsed = JSON.parse(ideateStage.input);
              const selectedIdea =
                parsed.selectedIdea && typeof parsed.selectedIdea === "object"
                  ? parsed.selectedIdea.title || parsed.selectedIdea.description || JSON.stringify(parsed.selectedIdea)
                  : parsed.selectedIdea || "";
              setIdeaContext(selectedIdea);
            } catch (e) {
              console.error("Failed to parse ideate data:", e);
            }
          }

          const validateStage = stagesData.stages?.find(
            (s: any) => s.stage === "validate" && s.status === "completed"
          );

          if (validateStage?.output) {
            try {
              const outputData =
                typeof validateStage.output === "string"
                  ? JSON.parse(validateStage.output)
                  : validateStage.output;

              const overview = outputData.overview || outputData.aiProductOverview;
              if (overview) {
                setValidateData(overview);
                return;
              }

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
        <span className="ml-2 text-neutral-600">Loading design wizard...</span>
      </div>
    );
  }

  return (
    <DesignWizard projectId={projectId} ideaContext={ideaContext} validateData={validateData} />
  );
}

