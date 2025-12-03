"use client";

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

interface AIProductOverviewPanelProps {
  overview: AIProductOverview | null;
  onChange: (updater: (prev: AIProductOverview) => AIProductOverview) => void;
  isEditing: boolean;
  improving: boolean;
}

export function AIProductOverviewPanel({
  overview,
  onChange,
  isEditing,
  improving,
}: AIProductOverviewPanelProps) {

  if (!overview) {
    return (
      <Card className="border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          Run "Refine My Idea with AI" to generate your AI Product Overview
        </p>
        <p className="mt-2 text-neutral-600">
          You'll get a polished pitch, personas, feature list, risks, monetisation ideas, and build notes—ready for Design.
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

  const renderDocument = () => (
    <div className="space-y-8 text-neutral-800">
      <DocText heading="Refined Elevator Pitch" body={overview.refinedPitch} />
      <DocText heading="Problem Summary" body={overview.problemSummary} />
      <PersonasDoc personas={overview.personas} />
      <DocText heading="Enhanced Solution Description" body={overview.solution} />
      <DocList heading="Core Features" items={overview.coreFeatures} />
      <DocText heading="What Makes This Unique (USP)" body={overview.uniqueValue} />
      <DocText heading="Market & Competitor Summary" body={overview.competition} />
      <RisksDoc risks={overview.risks} />
      <MonetisationDoc items={overview.monetisation} />
      <DocText heading="Technical / Build Notes" body={overview.buildNotes} />
    </div>
  );

  const renderEditor = () => (
    <div className="grid gap-6">
        <TextSection
          label="Refined Elevator Pitch"
          value={overview.refinedPitch}
          onChange={(value) => updateTextField("refinedPitch", value)}
        />
        <TextSection
          label="Problem Summary"
          value={overview.problemSummary}
          onChange={(value) => updateTextField("problemSummary", value)}
        />
        <PersonaSection
          personas={overview.personas}
          onAdd={addPersona}
          onRemove={removePersona}
          onUpdate={updatePersona}
        />
        <TextSection
          label="Enhanced Solution Description"
          value={overview.solution}
          onChange={(value) => updateTextField("solution", value)}
        />
        <CoreFeaturesSection
          features={overview.coreFeatures}
          onAdd={addCoreFeature}
          onRemove={removeCoreFeature}
          onUpdate={updateCoreFeature}
        />
        <TextSection
          label="What Makes This Unique (USP)"
          value={overview.uniqueValue}
          onChange={(value) => updateTextField("uniqueValue", value)}
        />
        <TextSection
          label="Market & Competitor Summary"
          value={overview.competition}
          onChange={(value) => updateTextField("competition", value)}
        />
        <RiskSection
          risks={overview.risks}
          onAdd={addRisk}
          onRemove={removeRisk}
          onUpdate={updateRisk}
        />
        <MonetisationSection
          items={overview.monetisation}
          onAdd={addMonetisation}
          onRemove={removeMonetisation}
          onUpdate={updateMonetisation}
        />
        <TextSection
          label="Technical / Build Notes"
          value={overview.buildNotes}
          onChange={(value) => updateTextField("buildNotes", value)}
        />
    </div>
  );

  return (
    <Card className="relative overflow-hidden border border-neutral-200 bg-white p-6 shadow-lg">
      {improving && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 text-neutral-600 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <p className="text-sm font-medium">Refining…</p>
        </div>
      )}
      {isEditing ? renderEditor() : renderDocument()}
    </Card>
  );
}

function TextSection({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-800">{label}</label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2"
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
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-800">Core Features</label>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Feature
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {features.map((feature, index) => (
          <div key={`${feature}-${index}`} className="flex items-start gap-2">
            <Textarea
              value={feature}
              onChange={(event) => onUpdate(index, event.target.value)}
              rows={3}
              className="flex-1"
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
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-800">User Personas</label>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Persona
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
        {personas.map((persona, index) => (
          <Card key={`${persona.name}-${index}`} className="border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start gap-3">
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
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-800">Risks & Mitigation</label>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Risk
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {risks.map((risk, index) => (
          <div key={`${risk.risk}-${index}`} className="rounded-lg border border-neutral-200 p-4">
            <Textarea
              value={risk.risk}
              onChange={(event) => onUpdate(index, "risk", event.target.value)}
              rows={2}
              className="mb-3"
              placeholder="Risk description"
            />
            <Textarea
              value={risk.mitigation}
              onChange={(event) => onUpdate(index, "mitigation", event.target.value)}
              rows={2}
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
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-800">Monetisation Options</label>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-4 w-4" /> Add Option
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
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
                placeholder="Describe how revenue is generated"
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

function DocText({ heading, body }: { heading: string; body?: string }) {
  const content = body?.trim();
  return (
    <section>
      <h3 className="text-lg font-semibold text-neutral-900">{heading}</h3>
      {content ? (
        <p className="mt-2 whitespace-pre-wrap text-neutral-700">{content}</p>
      ) : (
        <DocEmpty />
      )}
    </section>
  );
}

function DocList({ heading, items }: { heading: string; items: string[] }) {
  const list = (items || []).map((entry) => entry.trim()).filter(Boolean);
  return (
    <section>
      <h3 className="text-lg font-semibold text-neutral-900">{heading}</h3>
      {list.length ? (
        <ul className="mt-3 space-y-2 text-neutral-700">
          {list.map((item, index) => (
            <li key={`${item}-${index}`} className="relative pl-5">
              <span className="absolute left-0 top-1 text-sm text-purple-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <DocEmpty />
      )}
    </section>
  );
}

function DocBullets({ label, items }: { label: string; items: string[] }) {
  const list = (items || []).map((entry) => entry.trim()).filter(Boolean);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      {list.length ? (
        <ul className="mt-1 space-y-1 text-sm text-neutral-600">
          {list.map((item, index) => (
            <li key={`${item}-${index}`} className="relative pl-4">
              <span className="absolute left-0 top-0 text-neutral-400">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400">No details yet.</p>
      )}
    </div>
  );
}

function PersonasDoc({ personas }: { personas: AIProductPersona[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-neutral-900">Personas</h3>
      {personas.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {personas.map((persona, index) => (
            <div
              key={`${persona.name}-${index}`}
              className="rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm"
            >
              <p className="text-base font-semibold text-neutral-900">
                {persona.name?.trim() || `Persona ${index + 1}`}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                {persona.summary?.trim() || "No summary yet."}
              </p>
              <div className="mt-3 grid gap-3">
                <DocBullets label="Needs" items={persona.needs || []} />
                <DocBullets label="Motivations" items={persona.motivations || []} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DocEmpty />
      )}
    </section>
  );
}

function RisksDoc({ risks }: { risks: AIProductRisk[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-neutral-900">Risks & Mitigation</h3>
      {risks.length ? (
        <div className="mt-3 space-y-3">
          {risks.map((risk, index) => (
            <div
              key={`${risk.risk}-${index}`}
              className="rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-neutral-800">
                {risk.risk?.trim() || `Risk ${index + 1}`}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">Mitigation</p>
              <p className="text-sm text-neutral-700">
                {risk.mitigation?.trim() || "No mitigation provided."}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <DocEmpty />
      )}
    </section>
  );
}

function MonetisationDoc({ items }: { items: AIProductMonetisationOption[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-neutral-900">Monetisation Options</h3>
      {items.length ? (
        <div className="mt-3 space-y-3">
          {items.map((option, index) => (
            <div
              key={`${option.model}-${index}`}
              className="rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-neutral-900">
                {option.model?.trim() || `Option ${index + 1}`}
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                {option.description?.trim() || "No description provided."}
              </p>
              {option.pricingNotes && (
                <p className="mt-2 text-xs text-neutral-500">Pricing: {option.pricingNotes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <DocEmpty />
      )}
    </section>
  );
}

function DocEmpty() {
  return <p className="text-sm text-neutral-400">No details yet.</p>;
}

