"use client";

import { useParams } from "next/navigation";
import IntegrationMatrix from "@/components/build/IntegrationMatrix";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

export default function IntegrationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { blueprint } = useBuildBlueprint();
  const [ideaContext, setIdeaContext] = useState<string>("");
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
              const selectedIdea = parsed.selectedIdea;
              const context = selectedIdea && typeof selectedIdea === "object" && selectedIdea !== null
                ? selectedIdea.title || selectedIdea.description || JSON.stringify(selectedIdea)
                : selectedIdea || "";
              setIdeaContext(context);
            } catch (e) {
              console.error("Failed to parse ideate data:", e);
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
      </div>
    );
  }

  return (
    <IntegrationMatrix
      projectId={projectId}
      buildPath={blueprint?.build_path}
      featureSpecs={blueprint?.feature_specs}
      mvpScope={blueprint?.mvp_scope}
      ideaContext={ideaContext}
    />
  );
}

