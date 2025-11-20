"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface BuildBlueprint {
  id?: string;
  project_id: string;
  user_id?: string;
  build_path?: string;
  mvp_scope?: any;
  feature_specs?: any;
  data_model?: any;
  screens_components?: any;
  integrations?: any;
  developer_pack?: any;
  section_completion?: Record<string, boolean>;
  last_ai_run?: string;
  created_at?: string;
  updated_at?: string;
}

// Payload shape for updates sent to the API (camelCase fields)
interface BuildBlueprintUpdates {
  buildPath?: string;
  mvpScope?: any;
  featureSpecs?: any;
  dataModel?: any;
  screensComponents?: any;
  integrations?: any;
  developerPack?: any;
  sectionCompletion?: Record<string, boolean>;
  lastAiRun?: string;
}

interface BuildStageContextType {
  blueprint: BuildBlueprint | null;
  loading: boolean;
  saving: boolean;
  buildPath: string | null;
  sectionCompletion: Record<string, boolean>;
  loadBlueprint: () => Promise<void>;
  saveBlueprint: (updates: Partial<BuildBlueprintUpdates>) => Promise<void>;
  autosave: (updates: Partial<BuildBlueprintUpdates>) => void;
  updateSectionCompletion: (section: string, completed: boolean) => void;
  refreshBlueprint: () => Promise<void>;
}

const BuildStageContext = createContext<BuildStageContextType | undefined>(undefined);

export function BuildStageProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [blueprint, setBlueprint] = useState<BuildBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AUTO_SAVE_DELAY = 2000;

  const loadBlueprint = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/build/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error("Failed to load build blueprint:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveBlueprint = useCallback(async (updates: Partial<BuildBlueprintUpdates>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/build/blueprint", {
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
      console.error("Failed to save build blueprint:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const autosave = useCallback((updates: Partial<BuildBlueprintUpdates>) => {
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

  const updateSectionCompletion = useCallback((section: string, completed: boolean) => {
    if (!blueprint) return;

    const updatedCompletion = {
      ...(blueprint.section_completion || {}),
      [section]: completed,
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

  const buildPath = blueprint?.build_path || null;
  const sectionCompletion = blueprint?.section_completion || {};

  return (
    <BuildStageContext.Provider
      value={{
        blueprint,
        loading,
        saving,
        buildPath,
        sectionCompletion,
        loadBlueprint,
        saveBlueprint,
        autosave,
        updateSectionCompletion,
        refreshBlueprint,
      }}
    >
      {children}
    </BuildStageContext.Provider>
  );
}

export function useBuildBlueprint() {
  const context = useContext(BuildStageContext);
  if (context === undefined) {
    throw new Error("useBuildBlueprint must be used within a BuildStageProvider");
  }
  return context;
}

