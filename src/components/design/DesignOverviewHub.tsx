"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Loader2,
  Wand2,
  Clock,
  ArrowRight,
  Package,
  Users,
  Map,
  Layout,
  FileImage,
  Palette,
  Target,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignBlueprint {
  id: string;
  project_id: string;
  product_blueprint?: any;
  user_personas?: any;
  user_journey?: any;
  information_architecture?: any;
  wireframes?: any;
  brand_identity?: any;
  mvp_definition?: any;
  design_summary?: any;
  section_completion?: Record<string, boolean>;
  last_ai_run?: string;
}

interface DesignOverviewHubProps {
  projectId: string;
  ideaContext?: string;
  validateData?: any;
  onSectionClick?: (sectionId: string) => void;
}

const DESIGN_SECTIONS = [
  {
    id: "brand_identity",
    label: "Brand & Visual Identity",
    icon: Palette,
    description: "3-color palette, type pairing, tone-of-voice snippets",
  },
  {
    id: "product_blueprint",
    label: "Product Blueprint",
    icon: Package,
    description: "North star narrative with key features and flows",
  },
  {
    id: "user_personas",
    label: "User Personas",
    icon: Users,
    description: "2-4 named archetypes with goals and behaviors",
  },
  {
    id: "user_journey",
    label: "User Journey",
    icon: Map,
    description: "Stage-by-stage path with pain points and moments of delight",
  },
  {
    id: "information_architecture",
    label: "Information Architecture",
    icon: Layout,
    description: "Site map with nav labels and primary actions",
  },
  {
    id: "wireframes",
    label: "Wireframes & Layouts",
    icon: FileImage,
    description: "Low-fidelity screen layouts for core flows",
  },
  {
    id: "mvp_definition",
    label: "MVP Definition",
    icon: Target,
    description: "Must-have features, scope guardrails, and v1 timeline",
  },
  {
    id: "design_summary",
    label: "Design Summary & Export",
    icon: FileText,
    description: "Download-ready blueprint with highlights and next steps",
  },
] as const;

export default function DesignOverviewHub({
  projectId,
  ideaContext,
  validateData,
  onSectionClick,
}: DesignOverviewHubProps) {
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<DesignBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBlueprint();
  }, [projectId]);

  async function loadBlueprint() {
    try {
      setLoading(true);
      const response = await fetch(`/api/design/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error("Failed to load blueprint:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAllSections() {
    try {
      setGenerating(true);
      const response = await fetch("/api/design/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ideaContext,
          validateData,
        }),
      });

      if (response.ok) {
        await loadBlueprint();
      } else {
        const error = await response.json();
        console.error("Failed to generate:", error);
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setGenerating(false);
    }
  }

  const sectionCompletion = blueprint?.section_completion || {};
  const completedCount = Object.values(sectionCompletion).filter(Boolean).length;
  const totalSections = DESIGN_SECTIONS.length;
  const progress = Math.round((completedCount / totalSections) * 100);

  const ideaSummary = ideaContext?.trim();

  const handleBrandIdentityClick = () => {
    if (onSectionClick) {
      onSectionClick("brand_identity");
      return;
    }

    router.push(`/project/${projectId}/design/brand-identity`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-lg text-neutral-600">Loading design blueprint...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress Ring */}
      <Card className="border border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-purple-900">
                Design Overview Hub
              </CardTitle>
              <p className="text-sm text-purple-700 mt-1">
                Complete all 8 sections to finalize your design blueprint
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">
                {completedCount} / {totalSections}
              </div>
              <div className="text-sm text-purple-600">complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-700 font-medium">Overall Progress</span>
              <span className="text-purple-900 font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Latest AI Run Timestamp */}
          {blueprint?.last_ai_run && (
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <Clock className="h-3 w-3" />
              <span>
                Last AI generation: {new Date(blueprint.last_ai_run).toLocaleString()}
              </span>
            </div>
          )}

          {/* Global Generate Button */}
          <Button
            onClick={generateAllSections}
            disabled={generating}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Complete Design Blueprint...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Complete Design Blueprint
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validated Idea Context - Hero */}
      <Card className="border border-neutral-200 bg-gradient-to-r from-purple-50 via-white to-blue-50">
        <CardContent className="py-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
                <div className="h-1.5 w-8 rounded-full bg-purple-600" />
                <span>Validated Idea Context</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
                  Complete AI Overview
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700 line-clamp-3">
                  {ideaSummary ||
                    "No validated idea context available yet. Provide or generate context to tailor your design blueprint."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm ring-1 ring-purple-100">
                AI-driven insights at a glance
              </div>
              <Button
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={handleBrandIdentityClick}
              >
                Go to Brand & Visual Identity
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Snapshot Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {DESIGN_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isCompleted = sectionCompletion[section.id] || false;

          return (
            <Card
              key={section.id}
              className={cn(
                "border cursor-pointer transition-all hover:shadow-md",
                isCompleted
                  ? "border-green-200 bg-green-50"
                  : "border-neutral-200 bg-white"
              )}
              onClick={() => onSectionClick?.(section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isCompleted ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-base font-semibold text-neutral-900 mt-3">
                  {section.label}
                </CardTitle>
                <p className="text-xs text-neutral-600 mt-1">{section.description}</p>
              </CardHeader>
              <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSectionClick) {
                    onSectionClick(section.id);
                  } else {
                    // Fallback navigation
                    const sectionMap: Record<string, string> = {
                      product_blueprint: "product-blueprint",
                      user_personas: "user-personas",
                      user_journey: "user-journey",
                      information_architecture: "information-architecture",
                      wireframes: "wireframes",
                      brand_identity: "brand-identity",
                      mvp_definition: "mvp-definition",
                      design_summary: "design-summary",
                    };
                    const route = sectionMap[section.id] || section.id;
                    router.push(`/project/${projectId}/design/${route}`);
                  }
                }}
              >
                {isCompleted ? "Review" : "Start"}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

