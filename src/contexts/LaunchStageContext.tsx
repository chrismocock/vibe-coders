"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface LaunchBlueprint {
  id?: string;
  project_id: string;
  user_id?: string;
  launch_path_choice?: string;
  strategy_plan?: any;
  messaging_framework?: any;
  landing_onboarding?: any;
  early_adopters?: any;
  marketing_assets?: any;
  tracking_metrics?: any;
  launch_pack?: any;
  section_completion?: Record<string, boolean>;
  build_path_snapshot?: string;
  last_ai_run?: string;
  created_at?: string;
  updated_at?: string;
}

interface LaunchStageContextType {
  blueprint: LaunchBlueprint | null;
  loading: boolean;
  saving: boolean;
  launchPathChoice: string | null;
  buildPathMode: string | null;
  sectionCompletion: Record<string, boolean>;
  lastAiRun: string | null;
  loadBlueprint: () => Promise<void>;
  saveBlueprint: (updates: Partial<LaunchBlueprint>) => Promise<void>;
  autosave: (updates: Partial<LaunchBlueprint>) => void;
  saveSection: (sectionId: string, payload: any) => Promise<void>;
  markComplete: (sectionId: string) => void;
  refreshBlueprint: () => Promise<void>;
}

const LaunchStageContext = createContext<LaunchStageContextType | undefined>(undefined);

export function LaunchStageProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [blueprint, setBlueprint] = useState<LaunchBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AUTO_SAVE_DELAY = 2000;

  const loadBlueprint = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/launch/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error("Failed to load launch blueprint:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveBlueprint = useCallback(async (updates: Partial<LaunchBlueprint>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/launch/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...updates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
        return data.blueprint;
      } else {
        throw new Error("Failed to save blueprint");
      }
    } catch (error) {
      console.error("Failed to save launch blueprint:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const autosave = useCallback((updates: Partial<LaunchBlueprint>) => {
    // Clear existing timer
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    // Set new timer
    autosaveTimer.current = setTimeout(async () => {
      try {
        await saveBlueprint(updates);
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, AUTO_SAVE_DELAY);
  }, [saveBlueprint]);

  const saveSection = useCallback(async (sectionId: string, payload: any) => {
    if (!blueprint) return;

    const sectionMap: Record<string, keyof LaunchBlueprint> = {
      overview: "launch_path_choice",
      strategy: "strategy_plan",
      messaging: "messaging_framework",
      landing: "landing_onboarding",
      adopters: "early_adopters",
      assets: "marketing_assets",
      metrics: "tracking_metrics",
      pack: "launch_pack",
    };

    const fieldName = sectionMap[sectionId];
    if (!fieldName) return;

    const updates: Partial<LaunchBlueprint> = {
      [fieldName]: payload,
    };

    await saveBlueprint(updates);
  }, [blueprint, saveBlueprint]);

  const markComplete = useCallback((sectionId: string) => {
    if (!blueprint) return;

    const updatedCompletion = {
      ...(blueprint.section_completion || {}),
      [sectionId]: true,
    };

    const updates = {
      sectionCompletion: updatedCompletion,
    };

    setBlueprint({
      ...blueprint,
      section_completion: updatedCompletion,
    });

    autosave(updates);
  }, [blueprint, autosave]);

  const refreshBlueprint = useCallback(async () => {
    await loadBlueprint();
  }, [loadBlueprint]);

  useEffect(() => {
    loadBlueprint();
  }, [loadBlueprint]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, []);

  const launchPathChoice = blueprint?.launch_path_choice || null;
  const buildPathMode = blueprint?.build_path_snapshot || null;
  const sectionCompletion = blueprint?.section_completion || {};
  const lastAiRun = blueprint?.last_ai_run || null;

  return (
    <LaunchStageContext.Provider
      value={{
        blueprint,
        loading,
        saving,
        launchPathChoice,
        buildPathMode,
        sectionCompletion,
        lastAiRun,
        loadBlueprint,
        saveBlueprint,
        autosave,
        saveSection,
        markComplete,
        refreshBlueprint,
      }}
    >
      {children}
    </LaunchStageContext.Provider>
  );
}

export function useLaunchBlueprint() {
  const context = useContext(LaunchStageContext);
  if (context === undefined) {
    throw new Error("useLaunchBlueprint must be used within a LaunchStageProvider");
  }
  return context;
}

