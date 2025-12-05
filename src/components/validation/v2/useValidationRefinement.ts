"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AIProductOverview,
  ValidationPillarId,
  ValidationPillarResult,
} from "@/server/validation/types";

interface IdeaState {
  ideaStageId: string | null;
  title: string;
  summary: string;
  context?: string;
}

interface PillarResponsePayload {
  idea: IdeaState;
  pillars: ValidationPillarResult[];
  aiProductOverview: AIProductOverview | null;
  validatedIdeaId: string | null;
}

export type OverviewSectionKey =
  | "pitch"
  | "problem"
  | "personas"
  | "solution"
  | "features"
  | "market"
  | "usp"
  | "risks"
  | "monetisation"
  | "build";

export type SectionDiagnostics = Partial<Record<OverviewSectionKey, ValidationPillarResult[]>>;

const SECTION_PILLAR_MAP: Record<OverviewSectionKey, ValidationPillarId[]> = {
  pitch: [],
  problem: ["problemClarity"],
  personas: ["audienceFit"],
  solution: ["problemClarity", "solutionStrength"],
  features: [],
  market: ["marketSize"],
  usp: ["competition"],
  risks: [],
  monetisation: ["monetisation"],
  build: ["feasibility"],
};

const LOW_SCORE_THRESHOLD = 7;

function buildSectionDiagnostics(pillars: ValidationPillarResult[]): SectionDiagnostics {
  const diagnostics: SectionDiagnostics = {};

  (Object.keys(SECTION_PILLAR_MAP) as OverviewSectionKey[]).forEach((section) => {
    const relevant = SECTION_PILLAR_MAP[section]
      .map((pillarId) => pillars.find((pillar) => pillar.pillarId === pillarId))
      .filter(
        (pillar): pillar is ValidationPillarResult =>
          Boolean(pillar) && pillar.score < LOW_SCORE_THRESHOLD,
      );

    if (relevant.length) {
      diagnostics[section] = relevant;
    }
  });

  return diagnostics;
}

export function useValidationRefinement(projectId: string) {
  const [idea, setIdea] = useState<IdeaState | null>(null);
  const [pillars, setPillars] = useState<ValidationPillarResult[]>([]);
  const [overview, setOverview] = useState<AIProductOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [validatedIdeaId, setValidatedIdeaId] = useState<string | null>(null);
  const [lastRefinedAt, setLastRefinedAt] = useState<number | null>(null);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSave = useRef(false);

  const saveSnapshot = useCallback(async (override?: AIProductOverview | null) => {
    const overviewToSave = override ?? overview;
    if (!overviewToSave || !idea || pillars.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setSaveError(false);
    try {
      const response = await fetch("/api/validate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          idea,
          pillars,
          aiProductOverview: overviewToSave,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save validation overview");
      }

      const data = await response.json();
      setValidatedIdeaId(data.validatedIdea?.id ?? null);
      setLastSavedAt(Date.now());
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("section-updated"));
      }
    } catch (err) {
      console.error("Validation auto-save failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save overview");
      setError(err instanceof Error ? err.message : "Failed to save overview");
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [idea, overview, pillars, projectId]);

  const queueAutoSave = useCallback(() => {
    if (!overview || !idea || pillars.length === 0) {
      return;
    }

    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      autoSaveTimer.current = null;
      void saveSnapshot();
    }, 1200);
  }, [idea, overview, pillars, saveSnapshot]);

  const hydrateState = useCallback((payload: PillarResponsePayload) => {
    setIdea(payload.idea);
    setPillars(payload.pillars);
    if (payload.aiProductOverview) {
      setOverview(payload.aiProductOverview);
      skipNextAutoSave.current = true;
    }
    setValidatedIdeaId(payload.validatedIdeaId);
  }, []);

  const fetchPillars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/validate/pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load validation pillars");
      }

      const data = (await response.json()) as PillarResponsePayload;
      hydrateState(data);
      if (!data.aiProductOverview) {
        setOverview(null);
      }
      setLastSavedAt(data.aiProductOverview ? Date.now() : null);
    } catch (err) {
      console.error("Failed to load pillars:", err);
      setError(err instanceof Error ? err.message : "Failed to load pillars");
      toast.error(err instanceof Error ? err.message : "Failed to load pillars");
    } finally {
      setLoading(false);
    }
  }, [hydrateState, projectId]);

  useEffect(() => {
    fetchPillars();
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [fetchPillars]);

  const improveIdea = useCallback(async () => {
    if (!idea || pillars.length === 0) {
      toast.error("Pillars still loading. Please wait.");
      return;
    }

    setImproving(true);
    setError(null);
    try {
      const response = await fetch("/api/validate/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          idea,
          pillars,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to improve idea");
      }

      const data = await response.json();
      if (Array.isArray(data.pillars)) {
        setPillars(data.pillars);
      }
      setOverview(data.aiProductOverview);
      skipNextAutoSave.current = true;
      setLastSavedAt(null);
      setLastRefinedAt(Date.now());
      await saveSnapshot(data.aiProductOverview);
      toast.success("✨ Idea refined based on pillar insights.");
    } catch (err) {
      console.error("Improve idea failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to improve idea");
      setError(err instanceof Error ? err.message : "Failed to improve idea");
    } finally {
      setImproving(false);
    }
  }, [idea, pillars, projectId, saveSnapshot]);

  const updateOverview = useCallback(
    (updater: (prev: AIProductOverview) => AIProductOverview) => {
      setOverview((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        setLastSavedAt(null);
        return next;
      });
      queueAutoSave();
    },
    [queueAutoSave],
  );

  const sectionDiagnostics = useMemo(() => buildSectionDiagnostics(pillars), [pillars]);

  return {
    loading,
    error,
    idea,
    pillars,
    overview,
    improving,
    saving,
    saveError,
    lastSavedAt,
    lastRefinedAt,
    validatedIdeaId,
    improveIdea,
    updateOverview,
    sectionDiagnostics,
    refetch: fetchPillars,
    saveSnapshot,
  };
}


