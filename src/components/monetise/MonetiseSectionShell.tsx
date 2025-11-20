"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useMonetiseBlueprint } from "@/contexts/MonetiseStageContext";
import { cn } from "@/lib/utils";

interface MonetiseSectionShellProps {
  title: string;
  description?: string;
  sectionId: string;
  onGenerate?: () => Promise<void>;
  onSave?: () => Promise<void>;
  children: ReactNode;
  previousSection?: { href: string; label: string };
  nextSection?: { href: string; label: string };
  generating?: boolean;
  saving?: boolean;
}

export default function MonetiseSectionShell({
  title,
  description,
  sectionId,
  onGenerate,
  onSave,
  children,
  previousSection,
  nextSection,
  generating = false,
  saving = false,
}: MonetiseSectionShellProps) {
  const { saving: contextSaving } = useMonetiseBlueprint();
  const isSaving = saving || contextSaving;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
            {onGenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={onGenerate}
                disabled={generating}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate with AI"}
              </Button>
            )}
          </div>
        </div>
        {description && (
          <p className="text-neutral-600">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
        {previousSection ? (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = previousSection.href;
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {previousSection.label}
          </Button>
        ) : (
          <div />
        )}
        {nextSection && (
          <Button
            onClick={() => {
              window.location.href = nextSection.href;
            }}
          >
            {nextSection.label}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

