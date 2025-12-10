"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Map,
  Package,
  Palette,
  FileImage,
  FileText,
  Layout,
  Target,
  Users,
  Compass,
} from "lucide-react";

import BrandVisualIdentity from "./BrandVisualIdentity";
import ProductBlueprint from "./ProductBlueprint";
import UserPersonas from "./UserPersonas";
import UserJourneyMapping from "./UserJourneyMapping";
import InformationArchitecture from "./InformationArchitecture";
import WireframesLayouts from "./WireframesLayouts";
import MVPDefinition from "./MVPDefinition";
import DesignSummaryExport from "./DesignSummaryExport";

interface DesignWizardProps {
  projectId: string;
  ideaContext?: string;
  validateData?: any;
}

const wizardSteps = [
  { id: "brand_identity", label: "Brand & Visual Identity", icon: Palette },
  { id: "product_blueprint", label: "Product Blueprint", icon: Package },
  { id: "user_personas", label: "User Personas", icon: Users },
  { id: "user_journey", label: "User Journey", icon: Map },
  { id: "information_architecture", label: "Information Architecture", icon: Layout },
  { id: "wireframes", label: "Wireframes & Layouts", icon: FileImage },
  { id: "mvp_definition", label: "MVP Definition", icon: Target },
  { id: "design_summary", label: "Summary & Export", icon: FileText },
] as const;

export default function DesignWizard({ projectId, ideaContext, validateData }: DesignWizardProps) {
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const progress = useMemo(
    () => Math.round(((currentStep + 1) / wizardSteps.length) * 100),
    [currentStep]
  );

  useEffect(() => {
    loadBlueprint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadBlueprint() {
    try {
      if (!blueprint) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await fetch(`/api/design/blueprint?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBlueprint(data.blueprint);
      }
    } catch (error) {
      console.error("Failed to load blueprint:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleBlueprintUpdate = (updated?: any) => {
    if (updated) {
      setBlueprint(updated);
    } else {
      loadBlueprint();
    }
  };

  const StepComponent = useMemo(() => {
    const stepId = wizardSteps[currentStep].id;
    switch (stepId) {
      case "brand_identity":
        return (
          <BrandVisualIdentity
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "product_blueprint":
        return (
          <ProductBlueprint
            projectId={projectId}
            blueprint={blueprint}
            ideaContext={ideaContext}
            validateData={validateData}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "user_personas":
        return (
          <UserPersonas
            projectId={projectId}
            blueprint={blueprint}
            ideaContext={ideaContext}
            validateData={validateData}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "user_journey":
        return (
          <UserJourneyMapping
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "information_architecture":
        return (
          <InformationArchitecture
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "wireframes":
        return (
          <WireframesLayouts
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "mvp_definition":
        return (
          <MVPDefinition
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={handleBlueprintUpdate}
          />
        );
      case "design_summary":
      default:
        return (
          <DesignSummaryExport
            projectId={projectId}
            blueprint={blueprint}
            onUpdate={() => handleBlueprintUpdate()}
          />
        );
    }
  }, [blueprint, currentStep, ideaContext, projectId, validateData]);

  const goToStep = (index: number) => {
    setCurrentStep(Math.min(Math.max(index, 0), wizardSteps.length - 1));
  };

  const goNext = () => goToStep(currentStep + 1);
  const goPrevious = () => goToStep(currentStep - 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading design wizard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
            <Compass className="h-4 w-4" />
            Guided design wizard
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900">Step-by-step design flow</h2>
          <p className="text-sm text-neutral-600">
            Move through each section in order. Your updates save to the same blueprint so you can pause and resume anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/design`)}>
            Exit to overview
          </Button>
          <Button variant="outline" onClick={() => loadBlueprint()} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh data
          </Button>
        </div>
      </div>

      <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-purple-900">
                Step {currentStep + 1} of {wizardSteps.length}: {wizardSteps[currentStep].label}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <Badge variant="outline" className="border-purple-200 text-purple-800">
                  Guided
                </Badge>
                <span>Changes auto-save per section</span>
              </div>
            </div>
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-purple-700">
                <span>Wizard progress</span>
                <span className="font-semibold text-purple-900">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {wizardSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = (blueprint?.section_completion || {})[step.id];

              return (
                <button
                  key={step.id}
                  className="rounded-lg border border-purple-100 bg-white px-3 py-3 text-left shadow-sm transition hover:shadow-md focus:outline-none"
                  onClick={() => goToStep(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">{step.label}</div>
                  <div className="mt-1 text-xs text-neutral-600">{isActive ? "Current step" : "Jump to step"}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
            {StepComponent}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600">
              You can leave the wizard anytime. Progress stays synced with the overview and section pages.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push(`/project/${projectId}/design`)}>
                Save & return later
              </Button>
              <Button variant="outline" onClick={goPrevious} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={currentStep === wizardSteps.length - 1 ? () => router.push(`/project/${projectId}/design`) : goNext}>
                {currentStep === wizardSteps.length - 1 ? (
                  <>
                    Finish & return to overview <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next step <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

