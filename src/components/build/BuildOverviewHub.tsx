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
  Target,
  FileText,
  Database,
  Layout,
  Plug,
  Package,
  Rocket,
  Code,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface BuildBlueprint {
  id?: string;
  project_id: string;
  build_path?: string;
  mvp_scope?: any;
  feature_specs?: any;
  data_model?: any;
  screens_components?: any;
  integrations?: any;
  developer_pack?: any;
  section_completion?: Record<string, boolean>;
  last_ai_run?: string;
}

interface BuildOverviewHubProps {
  projectId: string;
  ideaContext?: string;
  designData?: any;
  validateData?: any;
  onSectionClick?: (sectionId: string) => void;
}

const BUILD_SECTIONS = [
  {
    id: "mvp_scope",
    label: "MVP Scope",
    icon: Target,
    description: "Prioritize features by tier",
  },
  {
    id: "features",
    label: "Features & User Stories",
    icon: FileText,
    description: "Define features with acceptance criteria",
  },
  {
    id: "data_model",
    label: "Data Model",
    icon: Database,
    description: "Design database schema and relationships",
  },
  {
    id: "screens",
    label: "Screens & Components",
    icon: Layout,
    description: "Map screens and component checklist",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    description: "Select and configure third-party services",
  },
  {
    id: "developer_pack",
    label: "Developer Pack",
    icon: Package,
    description: "Compile complete build blueprint",
  },
] as const;

export default function BuildOverviewHub({
  projectId,
  ideaContext,
  designData,
  validateData,
  onSectionClick,
}: BuildOverviewHubProps) {
  const router = useRouter();
  const { blueprint, loading, buildPath, sectionCompletion } = useBuildBlueprint();
  const [generating, setGenerating] = useState(false);

  const completedCount = Object.values(sectionCompletion).filter(Boolean).length;
  const totalSections = BUILD_SECTIONS.length;
  const progress = Math.round((completedCount / totalSections) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-600">Loading build overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Build Progress</span>
            <span className="text-sm font-normal text-neutral-600">
              {completedCount} of {totalSections} sections complete
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-neutral-600 mt-2">
            {progress}% complete
          </p>
        </CardContent>
      </Card>

      {/* Build Path Selection */}
      {!buildPath && (
        <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle>Select Your Build Path</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-4">
              Choose how you want to build your product to get customized guidance.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:border-purple-300 transition-colors">
                <CardHeader>
                  <Rocket className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">AI Tool</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Build it yourself with AI assistance (Cursor, v0.dev, etc.)
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-purple-300 transition-colors">
                <CardHeader>
                  <Users className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Hire Dev</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Create a PRD for external developers
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-purple-300 transition-colors">
                <CardHeader>
                  <Code className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Advanced</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Full technical blueprint for experienced teams
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections Grid */}
      {buildPath && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BUILD_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isCompleted = sectionCompletion[section.id] || false;

            return (
              <Card
                key={section.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isCompleted && "border-green-200 bg-green-50/30"
                )}
                onClick={() => {
                  if (onSectionClick) {
                    onSectionClick(section.id);
                  } else {
                    router.push(`/project/${projectId}/build/${section.id}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isCompleted ? "bg-green-100" : "bg-purple-100"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isCompleted ? "text-green-600" : "text-purple-600"
                      )} />
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{section.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">{section.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

