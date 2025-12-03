"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  AIProductMonetisationOption,
  AIProductOverview,
  AIProductPersona,
  AIProductRisk,
} from "@/server/validation/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { OverviewSectionKey, SectionDiagnostics } from "./useValidationRefinement";
import { OverviewSectionNav } from "./OverviewSectionNav";

interface AIProductOverviewPanelProps {
  overview: AIProductOverview | null;
  onChange: (updater: (prev: AIProductOverview) => AIProductOverview) => void;
  isEditing: boolean;
  improving: boolean;
  sectionDiagnostics: SectionDiagnostics;
}

const EMPTY_PLACEHOLDER = "(AI will generate this section after refinement)";

const NAV_SECTIONS: { key: OverviewSectionKey; label: string }[] = [
  { key: "pitch", label: "Elevator Pitch" },
  { key: "problem", label: "Problem Summary" },
  { key: "personas", label: "Personas" },
  { key: "solution", label: "Solution" },
  { key: "features", label: "Features" },
  { key: "usp", label: "USP" },
  { key: "risks", label: "Risks" },
  { key: "monetisation", label: "Monetisation" },
  { key: "build", label: "Technical Notes" },
];

export function AIProductOverviewPanel({
  overview,
  onChange,
  isEditing,
  improving,
  sectionDiagnostics,
}: AIProductOverviewPanelProps) {
  const [activeSection, setActiveSection] = useState<OverviewSectionKey>("pitch");
  const sectionRefs = useRef<Record<OverviewSectionKey, HTMLElement | null>>({
    pitch: null,
    problem: null,
    personas: null,
    solution: null,
    features: null,
    usp: null,
    risks: null,
    monetisation: null,
    build: null,
  });

  const assignSectionRef = useCallback(
    (key: OverviewSectionKey) => (node: HTMLElement | null) => {
      sectionRefs.current[key] = node;
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target instanceof HTMLElement) {
          const key = visible[0].target.dataset.sectionKey as OverviewSectionKey | undefined;
          if (key) {
            setActiveSection(key);
          }
        }
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.1, 0.25, 0.6],
      },
    );

    NAV_SECTIONS.forEach(({ key }) => {
      const node = sectionRefs.current[key];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [isEditing]);

  const handleSectionSelect = useCallback((key: OverviewSectionKey) => {
    const target = sectionRefs.current[key];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const navSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        active: section.key === activeSection,
      })),
    [activeSection],
  );

  if (!overview) {
    return (
      <Card className="border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          Run "Refine My Idea with AI" to generate your AI Product Overview
        </p>
        <p className="mt-2 text-neutral-600">
          You'll get a polished pitch, personas, feature list, risks, monetisation ideas, and build notes—ready for
          Design.
        </p>
      </Card>
    );
  }

  const updateTextField = (field: keyof AIProductOverview, value: string) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateCoreFeature = (index: number, value: string) => {
    onChange((prev) => {
      const features = [...prev.coreFeatures];
      features[index] = value;
      return { ...prev, coreFeatures: features };
    });
  };

  const addCoreFeature = () => {
    onChange((prev) => ({
      ...prev,
      coreFeatures: [...prev.coreFeatures, "New feature detail"],
    }));
  };

  const removeCoreFeature = (index: number) => {
    onChange((prev) => ({
      ...prev,
      coreFeatures: prev.coreFeatures.filter((_, i) => i !== index),
    }));
  };

  const updatePersona = (
    index: number,
    field: keyof AIProductPersona,
    value: string | string[],
  ) => {
    onChange((prev) => {
      const personas = [...prev.personas];
      personas[index] = {
        ...personas[index],
        [field]: value,
      };
      return { ...prev, personas };
    });
  };

  const addPersona = () => {
    onChange((prev) => ({
      ...prev,
      personas: [
        ...prev.personas,
        {
          name: "New Persona",
          summary: "Describe who this persona is and what they expect.",
          needs: ["Primary need"],
          motivations: ["Why they care"],
        },
      ],
    }));
  };

  const removePersona = (index: number) => {
    onChange((prev) => ({
      ...prev,
      personas: prev.personas.filter((_, i) => i !== index),
    }));
  };

  const updateRisk = (index: number, key: keyof AIProductRisk, value: string) => {
    onChange((prev) => {
      const risks = [...prev.risks];
      risks[index] = { ...risks[index], [key]: value };
      return { ...prev, risks };
    });
  };

  const addRisk = () => {
    onChange((prev) => ({
      ...prev,
      risks: [...prev.risks, { risk: "New risk", mitigation: "Mitigation approach" }],
    }));
  };

  const removeRisk = (index: number) => {
    onChange((prev) => ({
      ...prev,
      risks: prev.risks.filter((_, i) => i !== index),
    }));
  };

  const updateMonetisation = (
    index: number,
    key: keyof AIProductMonetisationOption,
    value: string,
  ) => {
    onChange((prev) => {
      const monetisation = [...prev.monetisation];
      monetisation[index] = { ...monetisation[index], [key]: value };
      return { ...prev, monetisation };
    });
  };

  const addMonetisation = () => {
    onChange((prev) => ({
      ...prev,
      monetisation: [
        ...prev.monetisation,
        { model: "New model", description: "Describe how it works", pricingNotes: "" },
      ],
    }));
  };

  const removeMonetisation = (index: number) => {
    onChange((prev) => ({
      ...prev,
      monetisation: prev.monetisation.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className="relative overflow-hidden border border-neutral-200 bg-neutral-50 p-4 shadow-md sm:p-6">
      {improving && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[1px] animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-neutral-600">Refining overview…</p>
        </div>
      )}
      <div className="flex flex-col gap-6 lg:flex-row">
        <OverviewSectionNav sections={navSections} onSelect={handleSectionSelect} />
        <div className="flex-1 space-y-6">
          {isEditing ? (
            <OverviewEditor
              overview={overview}
              registerRef={assignSectionRef}
              updateTextField={updateTextField}
              updatePersona={updatePersona}
              addPersona={addPersona}
              removePersona={removePersona}
              addCoreFeature={addCoreFeature}
              updateCoreFeature={updateCoreFeature}
              removeCoreFeature={removeCoreFeature}
              addRisk={addRisk}
              updateRisk={updateRisk}
              removeRisk={removeRisk}
              addMonetisation={addMonetisation}
              updateMonetisation={updateMonetisation}
              removeMonetisation={removeMonetisation}
            />
          ) : (
            <OverviewDocument
              overview={overview}
              diagnostics={sectionDiagnostics}
              registerRef={assignSectionRef}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

interface OverviewDocumentProps {
  overview: AIProductOverview;
  diagnostics: SectionDiagnostics;
  registerRef: (section: OverviewSectionKey) => (node: HTMLElement | null) => void;
}

function OverviewDocument({ overview, diagnostics, registerRef }: OverviewDocumentProps) {
  return (
    <div className="space-y-6">
      <SectionBlock
        title="Elevator Pitch"
        sectionKey="pitch"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <DocText body={overview.refinedPitch} />
      </SectionBlock>
      <SectionBlock
        title="Problem Summary"
        sectionKey="problem"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <DocText body={overview.problemSummary} />
      </SectionBlock>
      <SectionBlock
        title="Personas"
        sectionKey="personas"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <PersonasDoc personas={overview.personas} />
      </SectionBlock>
      <SectionBlock
        title="Solution"
        sectionKey="solution"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <DocText body={overview.solution} />
      </SectionBlock>
      <SectionBlock
        title="Feature Highlights"
        sectionKey="features"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <DocList items={overview.coreFeatures} />
      </SectionBlock>
      <SectionBlock
        title="Unique Value & Competition"
        sectionKey="usp"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-neutral-800">Unique Value</p>
            <DocText body={overview.uniqueValue} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">Competition Snapshot</p>
            <DocText body={overview.competition} />
          </div>
        </div>
      </SectionBlock>
      <SectionBlock title="Risks & Mitigation" sectionKey="risks" registerRef={registerRef} diagnostics={diagnostics}>
        <RisksDoc risks={overview.risks} />
      </SectionBlock>
      <SectionBlock
        title="Monetisation Strategy"
        sectionKey="monetisation"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <MonetisationDoc items={overview.monetisation} />
      </SectionBlock>
      <SectionBlock
        title="Technical / Build Notes"
        sectionKey="build"
        registerRef={registerRef}
        diagnostics={diagnostics}
      >
        <DocText body={overview.buildNotes} />
      </SectionBlock>
    </div>
  );
}

interface OverviewEditorProps {
  overview: AIProductOverview;
  registerRef: (section: OverviewSectionKey) => (node: HTMLElement | null) => void;
  updateTextField: (field: keyof AIProductOverview, value: string) => void;
  updatePersona: (index: number, field: keyof AIProductPersona, value: string | string[]) => void;
  addPersona: () => void;
  removePersona: (index: number) => void;
  addCoreFeature: () => void;
  updateCoreFeature: (index: number, value: string) => void;
  removeCoreFeature: (index: number) => void;
  addRisk: () => void;
  updateRisk: (index: number, key: keyof AIProductRisk, value: string) => void;
  removeRisk: (index: number) => void;
  addMonetisation: () => void;
  updateMonetisation: (index: number, key: keyof AIProductMonetisationOption, value: string) => void;
  removeMonetisation: (index: number) => void;
}

function OverviewEditor({
  overview,
  registerRef,
  updateTextField,
  updatePersona,
  addPersona,
  removePersona,
  addCoreFeature,
  updateCoreFeature,
  removeCoreFeature,
  addRisk,
  updateRisk,
  removeRisk,
  addMonetisation,
  updateMonetisation,
  removeMonetisation,
}: OverviewEditorProps) {
  return (
    <div className="space-y-6">
      <EditorSection title="Elevator Pitch" sectionKey="pitch" registerRef={registerRef}>
        <TextSection
          value={overview.refinedPitch}
          onChange={(value) => updateTextField("refinedPitch", value)}
        />
      </EditorSection>
      <EditorSection title="Problem Summary" sectionKey="problem" registerRef={registerRef}>
        <TextSection
          value={overview.problemSummary}
          onChange={(value) => updateTextField("problemSummary", value)}
        />
      </EditorSection>
      <EditorSection title="Personas" sectionKey="personas" registerRef={registerRef}>
        <PersonaSection personas={overview.personas} onAdd={addPersona} onRemove={removePersona} onUpdate={updatePersona} />
      </EditorSection>
      <EditorSection title="Solution Narrative" sectionKey="solution" registerRef={registerRef}>
        <TextSection value={overview.solution} onChange={(value) => updateTextField("solution", value)} rows={6} />
      </EditorSection>
      <EditorSection title="Feature Highlights" sectionKey="features" registerRef={registerRef}>
        <CoreFeaturesSection
          features={overview.coreFeatures}
          onAdd={addCoreFeature}
          onRemove={removeCoreFeature}
          onUpdate={updateCoreFeature}
        />
      </EditorSection>
      <EditorSection title="Unique Value & Competition" sectionKey="usp" registerRef={registerRef}>
        <div className="space-y-4">
          <TextSection
            label="Unique Value"
            value={overview.uniqueValue}
            onChange={(value) => updateTextField("uniqueValue", value)}
          />
          <TextSection
            label="Competition Snapshot"
            value={overview.competition}
            onChange={(value) => updateTextField("competition", value)}
            rows={5}
          />
        </div>
      </EditorSection>
      <EditorSection title="Risks & Mitigation" sectionKey="risks" registerRef={registerRef}>
        <RiskSection risks={overview.risks} onAdd={addRisk} onRemove={removeRisk} onUpdate={updateRisk} />
      </EditorSection>
      <EditorSection title="Monetisation" sectionKey="monetisation" registerRef={registerRef}>
        <MonetisationSection
          items={overview.monetisation}
          onAdd={addMonetisation}
          onRemove={removeMonetisation}
          onUpdate={updateMonetisation}
        />
      </EditorSection>
      <EditorSection title="Build Notes" sectionKey="build" registerRef={registerRef}>
        <TextSection value={overview.buildNotes} onChange={(value) => updateTextField("buildNotes", value)} rows={5} />
      </EditorSection>
    </div>
  );
}

interface SectionBlockProps {
  sectionKey: OverviewSectionKey;
  title: string;
  registerRef: (section: OverviewSectionKey) => (node: HTMLElement | null) => void;
  diagnostics: SectionDiagnostics;
  children: ReactNode;
}

function SectionBlock({ sectionKey, title, registerRef, diagnostics, children }: SectionBlockProps) {
  const badges = diagnostics[sectionKey] || [];
  return (
    <article
      ref={registerRef(sectionKey)}
      data-section-key={sectionKey}
      className="rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Section</p>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs text-neutral-500">
            <span className="mr-1 font-semibold text-neutral-600">Improved based on:</span>
            {badges.map((pillar) => (
              <span
                key={pillar.pillarId}
                className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700"
              >
                {pillar.pillarName}
              </span>
            ))}
          </div>
        )}
        <div className="pt-1">{children}</div>
      </div>
    </article>
  );
}

interface EditorSectionProps {
  sectionKey: OverviewSectionKey;
  title: string;
  registerRef: (section: OverviewSectionKey) => (node: HTMLElement | null) => void;
  children: ReactNode;
}

function EditorSection({ sectionKey, title, registerRef, children }: EditorSectionProps) {
  return (
    <section
      ref={registerRef(sectionKey)}
      data-section-key={sectionKey}
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function TextSection({
  value,
  onChange,
  rows = 4,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-semibold text-neutral-800">{label}</p>}
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={EMPTY_PLACEHOLDER}
        className="min-h-[120px] bg-neutral-50"
      />
    </div>
  );
}

function CoreFeaturesSection({
  features,
  onUpdate,
  onAdd,
  onRemove,
}: {
  features: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-neutral-900">Core Features</span>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Feature
        </Button>
      </div>
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={`${feature}-${index}`} className="flex gap-2">
            <Textarea
              value={feature}
              onChange={(event) => onUpdate(index, event.target.value)}
              rows={3}
              placeholder={EMPTY_PLACEHOLDER}
              className="flex-1 bg-neutral-50"
            />
            {features.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                aria-label="Remove feature"
              >
                <Trash2 className="h-4 w-4 text-neutral-500" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonaSection({
  personas,
  onUpdate,
  onAdd,
  onRemove,
}: {
  personas: AIProductPersona[];
  onUpdate: (index: number, field: keyof AIProductPersona, value: string | string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-neutral-900">User Personas</span>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Persona
        </Button>
      </div>
      <div className="grid gap-3">
        {personas.map((persona, index) => (
          <Card key={`${persona.name}-${index}`} className="border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-3">
                <Input
                  value={persona.name}
                  onChange={(event) => onUpdate(index, "name", event.target.value)}
                  placeholder="Persona name"
                />
                <Textarea
                  value={persona.summary}
                  onChange={(event) => onUpdate(index, "summary", event.target.value)}
                  rows={3}
                  placeholder={EMPTY_PLACEHOLDER}
                />
                <Input
                  value={persona.needs.join(", ")}
                  onChange={(event) =>
                    onUpdate(
                      index,
                      "needs",
                      event.target.value
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Needs (comma separated)"
                />
                <Input
                  value={(persona.motivations || []).join(", ")}
                  onChange={(event) =>
                    onUpdate(
                      index,
                      "motivations",
                      event.target.value
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Motivations (comma separated)"
                />
              </div>
              {personas.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  aria-label="Remove persona"
                >
                  <Trash2 className="h-4 w-4 text-neutral-500" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RiskSection({
  risks,
  onUpdate,
  onAdd,
  onRemove,
}: {
  risks: AIProductRisk[];
  onUpdate: (index: number, key: keyof AIProductRisk, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-neutral-900">Risks & Mitigation</span>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Risk
        </Button>
      </div>
      <div className="space-y-3">
        {risks.map((risk, index) => (
          <div key={`${risk.risk}-${index}`} className="rounded-xl border border-neutral-200 p-4">
            <Textarea
              value={risk.risk}
              onChange={(event) => onUpdate(index, "risk", event.target.value)}
              rows={2}
              className="mb-2 bg-neutral-50"
              placeholder="Risk description"
            />
            <Textarea
              value={risk.mitigation}
              onChange={(event) => onUpdate(index, "mitigation", event.target.value)}
              rows={2}
              className="bg-neutral-50"
              placeholder="How to mitigate"
            />
            {risks.length > 1 && (
              <div className="mt-2 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-neutral-500"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonetisationSection({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: AIProductMonetisationOption[];
  onUpdate: (index: number, key: keyof AIProductMonetisationOption, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-neutral-900">Monetisation Options</span>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Option
        </Button>
      </div>
      <div className="grid gap-3">
        {items.map((option, index) => (
          <Card key={`${option.model}-${index}`} className="border border-neutral-200 bg-neutral-50 p-4">
            <div className="space-y-3">
              <Input
                value={option.model}
                onChange={(event) => onUpdate(index, "model", event.target.value)}
                placeholder="Model (e.g., Subscription)"
              />
              <Textarea
                value={option.description}
                onChange={(event) => onUpdate(index, "description", event.target.value)}
                rows={3}
                placeholder={EMPTY_PLACEHOLDER}
              />
              <Input
                value={option.pricingNotes || ""}
                onChange={(event) => onUpdate(index, "pricingNotes", event.target.value)}
                placeholder="Pricing notes (optional)"
              />
            </div>
            {items.length > 1 && (
              <div className="mt-2 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-neutral-500"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocText({ body }: { body?: string }) {
  const content = body?.trim();
  if (!content) {
    return <DocPlaceholder />;
  }
  return <p className="whitespace-pre-line leading-relaxed text-neutral-700">{content}</p>;
}

function DocList({ items }: { items: string[] }) {
  const list = sanitizeList(items);
  if (!list.length) {
    return <DocPlaceholder />;
  }
  return (
    <ul className="space-y-2 text-neutral-700">
      {list.map((item) => (
        <li key={item} className="relative pl-5">
          <span className="absolute left-0 top-1 text-sm text-purple-500">•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function PersonasDoc({ personas }: { personas: AIProductPersona[] }) {
  if (!personas.length) {
    return <DocPlaceholder />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {personas.map((persona, index) => (
        <div key={`${persona.name}-${index}`} className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <p className="text-base font-semibold text-neutral-900">
            {persona.name?.trim() || `Persona ${index + 1}`}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {persona.summary?.trim() || EMPTY_PLACEHOLDER}
          </p>
          <div className="mt-3 grid gap-3">
            <DocBullets label="Needs" items={persona.needs || []} />
            <DocBullets label="Motivations" items={persona.motivations || []} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RisksDoc({ risks }: { risks: AIProductRisk[] }) {
  if (!risks.length) {
    return <DocPlaceholder />;
  }
  return (
    <div className="space-y-3">
      {risks.map((risk, index) => (
        <div
          key={`${risk.risk}-${index}`}
          className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-neutral-900">{risk.risk?.trim() || `Risk ${index + 1}`}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">Mitigation</p>
          <p className="text-sm text-neutral-700">{risk.mitigation?.trim() || EMPTY_PLACEHOLDER}</p>
        </div>
      ))}
    </div>
  );
}

function MonetisationDoc({ items }: { items: AIProductMonetisationOption[] }) {
  if (!items.length) {
    return <DocPlaceholder />;
  }
  return (
    <div className="space-y-3">
      {items.map((option, index) => (
        <div
          key={`${option.model}-${index}`}
          className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-neutral-900">
            {option.model?.trim() || `Option ${index + 1}`}
          </p>
          <p className="mt-2 text-sm text-neutral-700">{option.description?.trim() || EMPTY_PLACEHOLDER}</p>
          {option.pricingNotes && (
            <p className="mt-2 text-xs text-neutral-500">Pricing: {option.pricingNotes.trim()}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DocBullets({ label, items }: { label: string; items: string[] }) {
  const list = sanitizeList(items);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      {list.length ? (
        <ul className="mt-1 space-y-1 text-sm text-neutral-600">
          {list.map((item) => (
            <li key={item} className="relative pl-4">
              <span className="absolute left-0 top-0 text-neutral-400">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400">{EMPTY_PLACEHOLDER}</p>
      )}
    </div>
  );
}

function DocPlaceholder() {
  return <p className="text-sm text-neutral-400">{EMPTY_PLACEHOLDER}</p>;
}

function sanitizeList(items?: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  (items || []).forEach((item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  });
  return result;
}


