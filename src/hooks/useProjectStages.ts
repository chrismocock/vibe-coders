"use client";

import { useState, useEffect, useCallback } from "react";

export type StageData = {
  id: string;
  project_id: string;
  stage: string;
  input: string;
  output: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

export function useProjectStages(projectId: string | null) {
  const [stageData, setStageData] = useState<Record<string, StageData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/stages`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load stages");
      }
      const data = await response.json();
      const stageMap: Record<string, StageData> = {};
      (data.stages || []).forEach((stage: StageData) => {
        stageMap[stage.stage] = stage;
      });
      setStageData(stageMap);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load stages");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  return {
    stageData,
    loading,
    error,
    refetch: loadStages,
  };
}

