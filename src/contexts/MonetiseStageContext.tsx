"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface MonetiseBlueprint {
  id?: string;
  project_id: string;
  user_id?: string;
  monetisation_model?: string;
  pricing_strategy?: any;
  offer_plan?: any;
  checkout_flow?: any;
  activation_blueprint?: any;
  monetisation_assets?: any;
  revenue_pack?: any;
  section_completion?: Record<string, boolean>;
  build_path_snapshot?: string;
  last_ai_run?: string;
  created_at?: string;
  updated_at?: string;
}

interface MonetiseStageContextType {
  blueprint: MonetiseBlueprint | null;
  loading: boolean;
  saving: boolean;
  monetisationModel: string | null;
  buildPathMode: string | null;
  sectionCompletion: Record<string, boolean>;
  lastAiRun: string | null;
  loadBlueprint: () => Promise<void>;
  saveBlueprint: (updates: Partial<MonetiseBlueprint>) => Promise<void>;
  autosave: (updates: Partial<MonetiseBlueprint>) => void;
  saveSection: (sectionId: string, payload: any) => Promise<void>;
  markComplete: (sectionId: string) => void;
  refreshBlueprint: () => Promise<void>;
}

const MonetiseStageContext = createContext<MonetiseStageContextType | undefined>(undefined);

export function MonetiseStageProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [blueprint, setBlueprint] = useState<MonetiseBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AUTO_SAVE_DELAY = 2000;

  const loadBlueprint = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monetise/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error("Failed to load monetise blueprint:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveBlueprint = useCallback(async (updates: Partial<MonetiseBlueprint>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/monetise/blueprint", {
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
      console.error("Failed to save monetise blueprint:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const autosave = useCallback((updates: Partial<MonetiseBlueprint>) => {
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

    const sectionMap: Record<string, keyof MonetiseBlueprint> = {
      overview: "monetisation_model",
      pricing: "pricing_strategy",
      offer: "offer_plan",
      checkout: "checkout_flow",
      activation: "activation_blueprint",
      assets: "monetisation_assets",
      pack: "revenue_pack",
    };

    const fieldName = sectionMap[sectionId];
    if (!fieldName) return;

    const updates: Partial<MonetiseBlueprint> = {
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

  const monetisationModel = blueprint?.monetisation_model || null;
  const buildPathMode = blueprint?.build_path_snapshot || null;
  const sectionCompletion = blueprint?.section_completion || {};
  const lastAiRun = blueprint?.last_ai_run || null;

  return (
    <MonetiseStageContext.Provider
      value={{
        blueprint,
        loading,
        saving,
        monetisationModel,
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
    </MonetiseStageContext.Provider>
  );
}

export function useMonetiseBlueprint() {
  const context = useContext(MonetiseStageContext);
  if (context === undefined) {
    throw new Error("useMonetiseBlueprint must be used within a MonetiseStageProvider");
  }
  return context;
}

