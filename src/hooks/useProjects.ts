"use client";

import { useState, useEffect, useCallback } from "react";

export type Project = {
  id: string;
  title: string;
  description: string;
  progress: number;
};

export type ProjectStageSummary = {
  current: string;
  completedCount: number;
  totalStages: number;
};

export type ProjectWithStages = Project & {
  stageSummary?: ProjectStageSummary;
};

const STAGE_ORDER = ["ideate", "validate", "design", "build", "launch", "monetise"] as const;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithStages, setProjectsWithStages] = useState<ProjectWithStages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const list: Project[] = json.projects || [];
      setProjects(list);

      // Load stage summaries for each project
      const summaries = await Promise.all(
        list.map(async (p) => {
          try {
            const r = await fetch(`/api/projects/${p.id}/stages`, { cache: "no-store" });
            if (!r.ok) {
              return {
                id: p.id,
                current: "ideate",
                completedCount: 0,
                totalStages: STAGE_ORDER.length,
              };
            }
            const data = await r.json();
            const rows: Array<{ stage: string; status: "pending" | "in_progress" | "completed" }> =
              data.stages || [];
            const done = new Set(
              rows.filter((s) => s.status === "completed").map((s) => s.stage)
            );
            const completedCount = STAGE_ORDER.filter((s) => done.has(s)).length;
            const current =
              completedCount >= STAGE_ORDER.length
                ? "completed"
                : STAGE_ORDER[completedCount] || "ideate";
            return {
              id: p.id,
              current,
              completedCount,
              totalStages: STAGE_ORDER.length,
            };
          } catch {
            return {
              id: p.id,
              current: "ideate",
              completedCount: 0,
              totalStages: STAGE_ORDER.length,
            };
          }
        })
      );

      const projectsWithSummaries: ProjectWithStages[] = list.map((project) => {
        const summary = summaries.find((s) => s.id === project.id);
        return {
          ...project,
          stageSummary: summary
            ? {
                current: summary.current,
                completedCount: summary.completedCount,
                totalStages: summary.totalStages,
              }
            : undefined,
        };
      });

      setProjectsWithStages(projectsWithSummaries);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    projectsWithStages,
    loading,
    error,
    refetch: loadProjects,
  };
}

