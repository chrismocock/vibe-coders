"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_SUB_STAGES,
} from "@/lib/stageMetadata";

interface StageSetting {
  stage: string;
  sub_stage: string | null;
  enabled: boolean;
}

type SettingsMap = Record<string, boolean>;

function makeKey(stage: string, subStage?: string | null) {
  return subStage ? `${stage}:${subStage}` : stage;
}

export default function StageSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/stage-settings");
        if (res.ok) {
          const data: { settings: StageSetting[] } = await res.json();
          const map: SettingsMap = {};
          for (const row of data.settings || []) {
            map[makeKey(row.stage, row.sub_stage)] = row.enabled;
          }
          setSettings(map);
        }
      } catch (error) {
        console.error("Failed to load stage settings", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isEnabled = (stage: string, subStage?: string | null) => {
    const key = makeKey(stage, subStage);
    // default: enabled when no explicit setting
    return settings[key] ?? true;
  };

  const updateSetting = async (stage: string, subStage: string | null, enabled: boolean) => {
    const key = makeKey(stage, subStage);
    setSettings((prev) => ({ ...prev, [key]: enabled }));
    try {
      await fetch("/api/admin/stage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, subStage, enabled }),
      });
    } catch (error) {
      console.error("Failed to save stage setting", error);
    }
  };

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">
          Stage &amp; Section Visibility
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Enable or disable main stages and their detailed sections across the app.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {STAGE_ORDER.map((stageId) => {
          const label = STAGE_LABELS[stageId];
          const enabled = isEnabled(stageId);
          const subStages = STAGE_SUB_STAGES[stageId] || [];

          return (
            <div key={stageId} className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-500">
                    Controls visibility of the {label} stage in the workspace.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`stage-${stageId}`} className="text-xs text-neutral-600">
                    {enabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id={`stage-${stageId}`}
                    checked={enabled}
                    disabled={loading}
                    onCheckedChange={(value) => updateSetting(stageId, null, value)}
                  />
                </div>
              </div>

              {subStages.length > 0 && (
                <div className="mt-4 border-t border-neutral-200 pt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Sections
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {subStages.map((sub) => {
                      const subEnabled = isEnabled(stageId, sub.id);
                      const subKey = sub.id || "overview";
                      return (
                        <div
                          key={subKey}
                          className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
                        >
                          <p className="text-xs text-neutral-800">
                            {sub.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`sub-${stageId}-${subKey}`}
                              className="text-[11px] text-neutral-500"
                            >
                              {subEnabled ? "On" : "Off"}
                            </Label>
                            <Switch
                              id={`sub-${stageId}-${subKey}`}
                              checked={subEnabled}
                              disabled={loading || !enabled}
                              onCheckedChange={(value) =>
                                updateSetting(stageId, sub.id || null, value)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

