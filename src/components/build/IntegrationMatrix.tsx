"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface Integration {
  id: string;
  category: string;
  provider?: string;
  selected: boolean;
  explanation?: string;
  settings?: any;
  envVars?: string[];
  webhooks?: string[];
}

const INTEGRATION_CATEGORIES = [
  { id: "auth", label: "Authentication", icon: "🔐" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "email", label: "Email", icon: "📧" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "ai", label: "AI Services", icon: "🤖" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "storage", label: "Storage", icon: "💾" },
];

interface IntegrationMatrixProps {
  projectId: string;
  buildPath?: string;
  featureSpecs?: any;
  mvpScope?: any;
  ideaContext?: string;
}

export default function IntegrationMatrix({
  projectId,
  buildPath,
  featureSpecs,
  mvpScope,
  ideaContext,
}: IntegrationMatrixProps) {
  const { blueprint, saveBlueprint, autosave, updateSectionCompletion } = useBuildBlueprint();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blueprint?.integrations?.categories) {
      setIntegrations(blueprint.integrations.categories);
    } else {
      // Initialize with categories
      const initial: Integration[] = INTEGRATION_CATEGORIES.map(cat => ({
        id: cat.id,
        category: cat.id,
        selected: false,
      }));
      setIntegrations(initial);
    }
  }, [blueprint]);

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleUpdateIntegration = (id: string, updates: Partial<Integration>) => {
    setIntegrations(integrations.map(i => i.id === id ? { ...i, ...updates } : i));
    autosave({
      integrations: {
        categories: integrations.map(i => i.id === id ? { ...i, ...updates } : i),
      },
    });
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/build/integrations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          buildPath,
          featureSpecs,
          mvpScope,
          ideaContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result?.categories) {
          setIntegrations(data.result.categories);
        }
      }
    } catch (error) {
      console.error("Failed to generate integrations:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveBlueprint({
        integrations: {
          categories: integrations,
        },
      });
      updateSectionCompletion("integrations", true);
    } catch (error) {
      console.error("Failed to save integrations:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BuildSectionShell
      title="Integrations"
      description="Select and configure third-party services for your product"
      sectionId="integrations"
      onSave={handleSave}
      onAIGenerate={handleGenerate}
      saving={saving}
      generating={generating}
      showLock={true}
    >
      <div className="space-y-4">
        {INTEGRATION_CATEGORIES.map(category => {
          const integration = integrations.find(i => i.category === category.id);
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <Card key={category.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle>{category.label}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={integration?.selected || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (integration) {
                          handleUpdateIntegration(integration.id, { selected: e.target.checked });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && integration && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Provider</label>
                    <input
                      type="text"
                      value={integration.provider || ""}
                      onChange={(e) => handleUpdateIntegration(integration.id, { provider: e.target.value })}
                      placeholder="e.g., Stripe, Auth0, SendGrid"
                      className="w-full mt-1 px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Explanation</label>
                    <Textarea
                      value={integration.explanation || ""}
                      onChange={(e) => handleUpdateIntegration(integration.id, { explanation: e.target.value })}
                      placeholder="Why this integration is needed"
                      rows={2}
                    />
                  </div>
                  {buildPath === "advanced" && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Environment Variables</label>
                        <Textarea
                          value={(integration.envVars || []).join("\n")}
                          onChange={(e) => handleUpdateIntegration(integration.id, {
                            envVars: e.target.value.split("\n").filter(v => v.trim()),
                          })}
                          placeholder="API_KEY=xxx&#10;API_SECRET=yyy"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Webhooks</label>
                        <Textarea
                          value={(integration.webhooks || []).join("\n")}
                          onChange={(e) => handleUpdateIntegration(integration.id, {
                            webhooks: e.target.value.split("\n").filter(w => w.trim()),
                          })}
                          placeholder="https://api.example.com/webhook"
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </BuildSectionShell>
  );
}

