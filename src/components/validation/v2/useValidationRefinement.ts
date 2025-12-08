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

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

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
      .filter((pillar): pillar is ValidationPillarResult => {
        if (!pillar) return false;
        return pillar.score < LOW_SCORE_THRESHOLD;
      });

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
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const saveSnapshot = useCallback(async (override?: AIProductOverview | null) => {
    const overviewToSave = override ?? overview;
    if (!overviewToSave || !idea || pillars.length === 0) {
      const missingMessage =
        "Unable to save snapshot. Please wait for AI refinement to finish before saving.";
      setError(missingMessage);
      setSaveError(true);
      toast.error(missingMessage);
      return;
    }

    // Clear any pending retry timer
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
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

      const data = (await response.json()) as {
        validatedIdea?: { id?: string } | null;
      };
      if (data.validatedIdea?.id) {
        setValidatedIdeaId(data.validatedIdea.id);
      }
      setLastSavedAt(Date.now());
      setSaveError(false);
      retryCount.current = 0;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("section-updated"));
      }
    } catch (err) {
      console.error("Validation auto-save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save overview");
      setSaveError(true);
      // Only show toast on first failure, not on retries
      if (retryCount.current === 0) {
        toast.error(err instanceof Error ? err.message : "Failed to save overview");
      }
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
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [fetchPillars]);

  // Auto-retry when save error occurs
  useEffect(() => {
    if (saveError && !saving && retryCount.current < MAX_RETRIES) {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
      const delay = 2000 * (retryCount.current + 1); // Exponential backoff: 2s, 4s, 6s
      retryTimer.current = setTimeout(() => {
        retryCount.current += 1;
        retryTimer.current = null;
        void saveSnapshot();
      }, delay);
    } else if (saveError && retryCount.current >= MAX_RETRIES) {
      // Max retries reached, stop retrying
      setSaveError(false);
      retryCount.current = 0;
      toast.error("Failed to save after multiple attempts. Please try again.");
    }
    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [saveError, saving, saveSnapshot]);

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
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
          meta?: { kind?: string; summary?: string; issues?: string[] };
        };
        const baseMessage = errData.error || "Failed to improve idea";
        let detailedMessage = baseMessage;
        if (errData.meta?.summary) {
          detailedMessage = `${baseMessage}: ${errData.meta.summary}`;
        } else if (errData.meta?.kind === "timeout") {
          detailedMessage = `${baseMessage}. Please try again in a few seconds.`;
        } else if (errData.meta?.kind === "config") {
          detailedMessage = `${baseMessage}. Check OpenAI credentials in project settings.`;
        }
        const backendError = new Error(detailedMessage);
        (backendError as Error & { meta?: unknown }).meta = errData.meta;
        throw backendError;
      }

      const data = await response.json();
      const updatedPillars: ValidationPillarResult[] = Array.isArray(data.pillars)
        ? data.pillars
        : pillars;
      if (Array.isArray(data.pillars)) {
        setPillars(data.pillars);
      }
      setOverview(data.aiProductOverview);
      skipNextAutoSave.current = true;
      setLastSavedAt(null);
      setLastRefinedAt(Date.now());
      await saveSnapshot(data.aiProductOverview);
      const focusPillars = updatedPillars
        .filter((pillar) => pillar.score < LOW_SCORE_THRESHOLD)
        .map((pillar) => pillar.pillarName);
      const toastMessage = focusPillars.length
        ? `Based on pillar analysis: ${focusPillars.join(", ")}.`
        : "All pillars strong — AI polished the narrative.";
      toast.success(`✨ Idea refined! ${toastMessage}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to improve idea";
      console.error("Improve idea failed:", err);
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => {
            void improveIdea();
          },
        },
      });
      setError(message);
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

  const autoSaveStatus = useMemo<AutoSaveStatus>(() => {
    if (saving) return "saving";
    if (saveError) return "error";
    if (lastSavedAt) return "saved";
    return "idle";
  }, [lastSavedAt, saveError, saving]);

  const autoSaveLabel = useMemo(() => {
    switch (autoSaveStatus) {
      case "saving":
        return "Saving…";
      case "error":
        return "Error saving – retrying…";
      case "saved":
        return "✓ Auto-saved";
      default:
        return "Not saved yet";
    }
  }, [autoSaveStatus]);

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
    autoSaveStatus,
    autoSaveLabel,
    refetch: fetchPillars,
    saveSnapshot,
  };
}


