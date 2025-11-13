"use client";

import { useParams, useRouter } from "next/navigation";
import MVPScopeBoard from "@/components/build/MVPScopeBoard";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

export default function MVPScopePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { buildPath, loading: blueprintLoading } = useBuildBlueprint();
  const [ideaContext, setIdeaContext] = useState<string>("");
  const [designData, setDesignData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Route guard: redirect to overview if no build path
  useEffect(() => {
    if (!blueprintLoading && !buildPath) {
      router.push(`/project/${projectId}/build`);
    }
  }, [buildPath, blueprintLoading, projectId, router]);

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

        const designResponse = await fetch(`/api/design/blueprint?projectId=${projectId}`);
        if (designResponse.ok) {
          const data = await designResponse.json();
          setDesignData(data.blueprint);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (blueprintLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!buildPath) {
    return null; // Will redirect
  }

  return (
    <MVPScopeBoard
      projectId={projectId}
      ideaContext={ideaContext}
      designData={designData}
    />
  );
}

