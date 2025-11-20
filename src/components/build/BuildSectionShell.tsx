"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save, Loader2, CheckCircle2, AlertCircle, Wand2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface BuildSectionShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  sectionId: string;
  onSave?: () => Promise<void>;
  onAIGenerate?: () => Promise<void>;
  saving?: boolean;
  generating?: boolean;
  showLock?: boolean;
  lockMessage?: string;
}

export default function BuildSectionShell({
  title,
  description,
  children,
  sectionId,
  onSave,
  onAIGenerate,
  saving = false,
  generating = false,
  showLock = false,
  lockMessage = "Please select a build path first",
}: BuildSectionShellProps) {
  const { buildPath, sectionCompletion, saving: contextSaving } = useBuildBlueprint();
  const isCompleted = sectionCompletion[sectionId] || false;
  const isLocked = showLock && !buildPath;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
          {description && (
            <p className="text-neutral-600 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">{lockMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onAIGenerate && (
                <Button
                  onClick={onAIGenerate}
                  disabled={generating || isLocked}
                  variant="outline"
                  className="gap-2"
                  title={isLocked ? "Please select a build path first" : "Generate suggestions using AI"}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button
                  onClick={onSave}
                  disabled={saving || contextSaving || isLocked}
                  className="gap-2"
                >
                  {saving || contextSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className={cn(isLocked && "opacity-50 pointer-events-none")}>
        {children}
      </div>
    </div>
  );
}

