"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, Loader2, Wand2, Users, Target, TrendingUp, Wrench, DollarSign, Info, AlertCircle } from "lucide-react";
import { InitialFeedback, InitialFeedbackData, dimensionImpacts, dimensionIcons, getImpactBadge, getImpactStatement } from "@/components/ideate/InitialFeedback";
import { IDEATE_PILLARS, IDEATE_PILLAR_WEIGHTS, ImprovementDirection } from "@/lib/ideate/pillars";
import { ImprovementHistory, ImprovementHistoryEntry, SectionDiff } from "@/components/ideate/ImprovementHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProductOverview } from "@/server/ideate/refinementEngine";

type Mode = "explore-idea" | "solve-problem" | "surprise-me" | null;

type ScoreDelta = { from: number | null; to: number; change: number | null };

type ImprovementLogEntry = ImprovementHistoryEntry;

// Helper component for formatted markdown text in Refined Overview
function FormattedOverviewText({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-neutral-900 mt-3 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-neutral-800 mt-2 mb-1.5">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-neutral-600">
            {children}
          </em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 ml-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">
            {children}
          </li>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Map section titles to overview keys
const SECTION_TITLE_TO_KEY: Record<string, keyof ProductOverview> = {
  'Refined Elevator Pitch': 'refinedPitch',
  'Problem Summary': 'problemSummary',
  'Solution Description': 'solution',
  'Competition Summary': 'competition',
  'Personas': 'personas',
  'Core Features': 'coreFeatures',
  'Unique Value Proposition': 'uniqueValue',
  'Monetisation Model': 'monetisation',
  'Market Size': 'marketSize',
  'Build Notes': 'buildNotes',
  'Risks & Mitigations': 'risks',
};

// Serialize ProductOverview to markdown string format
function serializeOverview(overview: ProductOverview): string {
  const sections: string[] = [
    `Refined Pitch:\n${overview.refinedPitch}`,
    `Problem Summary:\n${overview.problemSummary}`,
    `Solution:\n${overview.solution}`,
    `Competition:\n${overview.competition}`,
    `Unique Value:\n${overview.uniqueValue}`,
    `Market Size:\n${overview.marketSize}`,
    `Build Notes:\n${overview.buildNotes}`,
    `Monetisation:\n${Array.isArray(overview.monetisation) ? overview.monetisation.map((m: any) => `${m.model || 'Model'}: ${m.description || ''}`).join('\n') : String(overview.monetisation || '')}`,
    `Personas:\n${Array.isArray(overview.personas) ? overview.personas.map((p: any) => `${p.name || 'Persona'}: ${p.summary || ''}`).join('\n') : String(overview.personas || '')}`,
    `Core Features:\n${Array.isArray(overview.coreFeatures) ? overview.coreFeatures.join('\n') : String(overview.coreFeatures || '')}`,
    `Risks:\n${Array.isArray(overview.risks) ? overview.risks.map((r: any) => `${r.risk || 'Risk'}: ${r.mitigation || ''}`).join('\n') : String(overview.risks || '')}`,
  ];
  return sections.join('\n\n').trim();
}

// Helper function to generate score change description
function generateScoreChangeDescription(
  pillarId: string,
  change: number,
  from: number | null,
  to: number | null,
  currentFeedback: InitialFeedbackData | null,
  previousFeedback: InitialFeedbackData | null
): string {
  const pillarKeyMap: Record<string, keyof InitialFeedbackData['scores']> = {
    audienceFit: 'audienceFit',
    competition: 'competition',
    marketDemand: 'marketDemand',
    feasibility: 'feasibility',
    pricingPotential: 'pricingPotential',
  };

  const pillarKey = pillarKeyMap[pillarId];
  if (!pillarKey) return '';

  const currentRationale = currentFeedback?.scores[pillarKey]?.rationale || '';
  const previousRationale = previousFeedback?.scores[pillarKey]?.rationale || '';

  // Use current rationale to explain the change
  if (currentRationale) {
    if (change > 0) {
      // Score increased
      if (from !== null && to !== null) {
        // Capitalize first letter and ensure proper punctuation
        const rationale = currentRationale.trim();
        const capitalizedRationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);
        return `Score increased from ${from} to ${to} because ${capitalizedRationale}`;
      }
      const rationale = currentRationale.trim();
      const capitalizedRationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);
      return `Score increased because ${capitalizedRationale}`;
    } else if (change < 0) {
      // Score decreased
      if (from !== null && to !== null) {
        const rationale = currentRationale.trim();
        const capitalizedRationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);
        return `Score decreased from ${from} to ${to} due to ${capitalizedRationale}`;
      }
      const rationale = currentRationale.trim();
      const capitalizedRationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);
      return `Score decreased due to ${capitalizedRationale}`;
    }
  }

  // Fallback if no rationale available
  if (from !== null && to !== null) {
    return change > 0 
      ? `Score increased from ${from} to ${to}`
      : `Score decreased from ${from} to ${to}`;
  }

  return 'Score changed';
}

// Score Change Explanation Component
function ScoreChangeExplanation({ 
  feedbackDeltas,
  currentFeedback,
  previousFeedback 
}: { 
  feedbackDeltas: Partial<Record<string, ScoreDelta>>;
  currentFeedback: InitialFeedbackData | null;
  previousFeedback: InitialFeedbackData | null;
}) {
  const hasScoreChanges = Object.keys(feedbackDeltas).some(
    (key) => key !== 'overallConfidence' && feedbackDeltas[key]?.change !== null && feedbackDeltas[key]?.change !== 0
  );
  const overallDelta = feedbackDeltas.overallConfidence?.change;
  const hasOverallChange = typeof overallDelta === 'number' && overallDelta !== 0;
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!hasScoreChanges && !hasOverallChange) return null;
  
  // Get pillar changes with descriptions
  const pillarChanges = IDEATE_PILLARS.map((pillar) => {
    const delta = feedbackDeltas[pillar.id];
    return {
      pillar: pillar.label,
      weight: pillar.weight,
      change: delta?.change ?? null,
      from: delta?.from ?? null,
      to: delta?.to ?? null,
      description: delta?.change !== null && delta?.change !== 0
        ? generateScoreChangeDescription(
            pillar.id,
            delta.change,
            delta.from ?? null,
            delta.to ?? null,
            currentFeedback,
            previousFeedback
          )
        : null,
    };
  }).filter((p) => p.change !== null && p.change !== 0);
  
  return (
    <Card className={cn(
      "border shadow-sm transition-colors",
      hasOverallChange && overallDelta && overallDelta < 0
        ? "border-amber-200 bg-amber-50/30"
        : "border-blue-200 bg-blue-50/30"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "rounded-full p-2",
              hasOverallChange && overallDelta && overallDelta < 0
                ? "bg-amber-100"
                : "bg-blue-100"
            )}>
              <Info className={cn(
                "h-5 w-5",
                hasOverallChange && overallDelta && overallDelta < 0
                  ? "text-amber-700"
                  : "text-blue-700"
              )} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Understanding Score Changes
              </CardTitle>
              <CardDescription className="text-sm text-neutral-600 mt-1">
                {hasOverallChange && overallDelta && overallDelta < 0
                  ? `Overall confidence decreased by ${Math.abs(overallDelta)} points. Here's why:`
                  : "Learn how AI enhancements affect your scores"}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show details
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* How Overall Confidence is Calculated */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">How Overall Confidence is Calculated</h4>
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 space-y-2">
              <p className="text-sm text-neutral-700">
                Overall confidence is a <strong>weighted average</strong> of all five validation pillars:
              </p>
              <div className="bg-white rounded border border-neutral-200 p-3 font-mono text-xs text-neutral-800">
                Overall Confidence = (Audience Fit × 20%) + (Competition × 20%) + (Market Demand × 25%) + (Feasibility × 15%) + (Pricing Potential × 20%)
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Each pillar is weighted based on its importance in validating your idea.
              </p>
            </div>
          </div>
          
          {/* Pillar Weights */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">Pillar Weights</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {IDEATE_PILLARS.map((pillar) => (
                <div key={pillar.id} className="flex items-center justify-between rounded-lg bg-white border border-neutral-200 p-2.5">
                  <span className="text-sm text-neutral-700">{pillar.label}</span>
                  <span className="text-sm font-semibold text-neutral-900">{Math.round(pillar.weight * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Current Score Changes */}
          {pillarChanges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900">Current Score Changes</h4>
              <div className="space-y-2">
                {pillarChanges.map((change) => (
                  <div key={change.pillar} className="rounded-lg bg-white border border-neutral-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-700">{change.pillar}</span>
                        <span className="text-xs text-neutral-500">
                          (Weight: {Math.round(change.weight * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {typeof change.from === 'number' && typeof change.to === 'number' && (
                          <span className="text-xs text-neutral-500">
                            {change.from} → {change.to}
                          </span>
                        )}
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                          change.change && change.change > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {change.change && change.change > 0 ? '+' : ''}
                          {change.change} pts
                        </span>
                      </div>
                    </div>
                    {change.description && (
                      <div className="mt-2 pt-2 border-t border-neutral-100">
                        <p className="text-xs text-neutral-600 leading-relaxed">{change.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Why Scores Change */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">Why Scores Change</h4>
            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex gap-3">
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="font-medium text-neutral-900 mb-1">Complete Re-evaluation</p>
                  <p>When you apply an AI enhancement, the entire idea overview is re-evaluated by the AI feedback system. All five pillars are assessed against the new content, not just the target pillar.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="font-medium text-neutral-900 mb-1">Content Interdependence</p>
                  <p>Changing one section (e.g., Solution) can affect how other sections are evaluated. For example, improving competition positioning might reveal gaps in market demand assessment.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="font-medium text-neutral-900 mb-1">Weighted Impact</p>
                  <p>Each pillar's impact on overall confidence depends on its weight. Market Demand (25%) has more influence than Feasibility (15%), so changes to Market Demand affect the overall score more.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Why Overall Can Decrease */}
          {hasOverallChange && overallDelta && overallDelta < 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900">Why Overall Confidence Decreased</h4>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="text-sm text-neutral-700">
                  Even though your <strong>target pillar improved</strong>, the overall confidence decreased because:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700 ml-2">
                  <li>Other pillars were re-evaluated and may have scored lower</li>
                  <li>The weighted average calculation means decreases in higher-weighted pillars (like Market Demand at 25%) have more impact</li>
                  <li>AI enhancements focus on improving one specific pillar, not optimizing all pillars simultaneously</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-neutral-600">
                    <strong>Example:</strong> If Competition improves by +5 points (20% weight = +1 point to overall) but Market Demand decreases by -8 points (25% weight = -2 points to overall), the net result is -1 point to overall confidence, even though the target pillar improved.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Recommendation */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">💡 Tip</p>
            <p className="text-sm text-blue-800">
              To improve overall confidence, consider applying enhancements to multiple pillars, especially those with higher weights (Market Demand, Competition, Audience Fit).
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
}

// Mock ideas for "Surprise me" mode
const mockIdeas: GeneratedIdea[] = [
  {
    id: "idea-1",
    title: "RemoteTeam Sync - AI-Powered Async Collaboration Platform",
    description: "A platform that helps remote teams collaborate asynchronously with AI-powered scheduling, context sharing, and progress tracking. Solves the timezone and communication challenges of distributed teams.",
  },
  {
    id: "idea-2",
    title: "EcoTrack - Personal Carbon Footprint Tracker & Offset Marketplace",
    description: "An app that tracks your daily carbon footprint through purchases and activities, then connects you to verified carbon offset projects. Makes sustainability measurable and actionable for individuals.",
  },
  {
    id: "idea-3",
    title: "HealthGuard AI - Personalized Preventive Health Assistant",
    description: "An AI-powered health assistant that analyzes your lifestyle, symptoms, and health data to provide personalized preventive recommendations, early warning alerts, and connects you with appropriate healthcare providers.",
  },
];

const PILLAR_KEY_TO_LABEL: Record<string, string> = {
  audienceFit: "Audience Fit",
  competition: "Competition",
  marketDemand: "Market Demand",
  feasibility: "Feasibility",
  pricingPotential: "Pricing Potential",
};

const PILLAR_LABEL_TO_KEY: Record<string, string> = Object.entries(
  PILLAR_KEY_TO_LABEL,
).reduce((acc, [key, label]) => {
  acc[label.toLowerCase()] = key;
  return acc;
}, {} as Record<string, string>);

const OVERVIEW_SECTIONS: { key: keyof ProductOverview; label: string }[] = [
  { key: "refinedPitch", label: "Refined Elevator Pitch" },
  { key: "problemSummary", label: "Problem Summary" },
  { key: "personas", label: "Personas" },
  { key: "solution", label: "Solution Description" },
  { key: "coreFeatures", label: "Core Features" },
  { key: "uniqueValue", label: "Unique Value Proposition" },
  { key: "competition", label: "Competition Summary" },
  { key: "monetisation", label: "Monetisation Model" },
  { key: "marketSize", label: "Market Size" },
  { key: "buildNotes", label: "Build Notes" },
  { key: "risks", label: "Risks & Mitigations" },
];

function formatOverviewValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return "";
        if (typeof entry === "string") return entry;
        if (typeof entry === "object") {
          return Object.values(entry as Record<string, unknown>)
            .filter((part) => typeof part === "string" && part.trim().length)
            .join(" — ");
        }
        return String(entry);
      })
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return "";
}

function parseOverviewSnapshot(value: unknown): ProductOverview | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ProductOverview;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as ProductOverview;
  }
  return null;
}

function buildOverviewDifferences(
  before: ProductOverview | null,
  after: ProductOverview | null,
): SectionDiff[] {
  if (!before && !after) return [];
  const diffs: SectionDiff[] = [];
  for (const section of OVERVIEW_SECTIONS) {
    const beforeText = before ? formatOverviewValue((before as unknown as Record<string, unknown>)[section.key]) : "";
    const afterText = after ? formatOverviewValue((after as unknown as Record<string, unknown>)[section.key]) : "";
    if (beforeText !== afterText) {
      diffs.push({
        section: section.label,
        before: beforeText,
        after: afterText,
      });
    }
  }
  if (!diffs.length && after) {
    const primary = OVERVIEW_SECTIONS[0];
    diffs.push({
      section: primary.label,
      before: before ? formatOverviewValue((before as unknown as Record<string, unknown>)[primary.key]) : "",
      after: formatOverviewValue((after as unknown as Record<string, unknown>)[primary.key]),
    });
  }
  return diffs;
}

function mapImprovementRows(rows: any[]): ImprovementLogEntry[] {
  return rows
    .map((row, index) => {
      const before = parseOverviewSnapshot(row?.before_text);
      const after = parseOverviewSnapshot(row?.after_text);
      const differences = buildOverviewDifferences(before, after);
      return {
        id: row?.id ?? `history-${index}`,
        pillar: row?.pillar_improved || "Unknown pillar",
        scoreDelta: typeof row?.score_delta === "number" ? row.score_delta : null,
        differences,
        beforeSection: differences[0]?.before,
        afterSection: differences[0]?.after,
        improvedOverview: after,
        createdAt: row?.created_at || new Date().toISOString(),
      } as ImprovementLogEntry;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function IdeateWizardPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [userInput, setUserInput] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [targetMarket, setTargetMarket] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [budget, setBudget] = useState("");
  const [timescales, setTimescales] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [aiReview, setAiReview] = useState<string>("");
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  interface IdeaHistoryEntry {
    id: string;
    savedAt: string;
    title: string;
    summary: string;
    content: string;
    targetMarket?: string | null;
    targetCountry?: string | null;
    budget?: string | null;
    timescales?: string | null;
    validation?: any;
  }

  interface IdeaHistoryEntry {
    id: string;
    savedAt: string;
    title: string;
    summary: string;
    validation?: any;
  }

  const [savedData, setSavedData] = useState<{
    input: any;
    output: any;
    status: string;
  } | null>(null);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const [showFullReview, setShowFullReview] = useState(false);
  const [ideasGenerated, setIdeasGenerated] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideaGenerationError, setIdeaGenerationError] = useState<string | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Record<string, boolean>>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [initialFeedback, setInitialFeedback] = useState<any>(null);
  const [isLoadingInitialFeedback, setIsLoadingInitialFeedback] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editForm, setEditForm] = useState({
    ideaText: "",
    targetMarket: "",
    targetCountry: "",
    budget: "",
    timescales: "",
  });
  const [isSavingEditedIdea, setIsSavingEditedIdea] = useState(false);
  const [isImprovingIdea, setIsImprovingIdea] = useState(false);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [draftValidation, setDraftValidation] = useState<InitialFeedbackData | null>(null);
  interface RevalidateOptions {
    aiProductOverviewOverride?: string;
  }
  interface RevalidateResult {
    feedbackData: InitialFeedbackData;
    aiProductOverview: string;
  }
  const [validationDeltas, setValidationDeltas] = useState<Partial<Record<string, ScoreDelta>>>({});
  const [feedbackDeltas, setFeedbackDeltas] = useState<Partial<Record<string, ScoreDelta>>>({});
  const [previousFeedback, setPreviousFeedback] = useState<InitialFeedbackData | null>(null);
  const [showInitialFeedbackReport, setShowInitialFeedbackReport] = useState(true);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  const [refinedOverview, setRefinedOverview] = useState<ProductOverview | null>(null);
  const [improvementLog, setImprovementLog] = useState<ImprovementLogEntry[]>([]);
  const [refineLoadingPillar, setRefineLoadingPillar] = useState<string | null>(null);
  const [autoImproving, setAutoImproving] = useState(false);
  const [overviewHistory, setOverviewHistory] = useState<ProductOverview[]>([]);

  // Minimize Initial Feedback in edit mode, maximize in view mode
  useEffect(() => {
    setShowInitialFeedbackReport(!isEditingExisting);
  }, [isEditingExisting]);

  useEffect(() => {
    setFeedbackDeltas({});
  }, [projectId]);

  interface RefinementSuggestion {
    id: string;
    pillar: string;
    pillarKey: string;
    score: number | null;
    issue: string;
    rationale: string;
    suggestion: string;
    estimatedImpact: number;
  }

  const [refinementSuggestions, setRefinementSuggestions] = useState<RefinementSuggestion[] | null>(null);
  const [showNarrativeEditor, setShowNarrativeEditor] = useState(false);
  interface PillarDirectionState {
    directions: ImprovementDirection[];
    generatedAt: string;
  }
  const [pillarDirections, setPillarDirections] = useState<Record<string, PillarDirectionState>>({});
  const [pillarDirectionErrors, setPillarDirectionErrors] = useState<Record<string, string | null>>({});
  const [directionLoadingPillar, setDirectionLoadingPillar] = useState<string | null>(null);

  const loadImprovementHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/ideate/improvements`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const rows = Array.isArray(data?.improvements) ? data.improvements : [];
      setImprovementLog(mapImprovementRows(rows));
    } catch (error) {
      console.error("Improvement history load error:", error);
    }
  }, [projectId]);

  // Load saved ideate data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/stages`);
        if (response.ok) {
          const data = await response.json();
          const ideateStage = data.stages?.find((s: any) => s.stage === 'ideate' && s.status === 'completed');
          if (ideateStage) {
            try {
              const parsedInput = JSON.parse(ideateStage.input);
              if (!Array.isArray(parsedInput.ideaHistory)) {
                parsedInput.ideaHistory = [];
              }
              // Try to parse output as JSON (new format), fallback to string (old format)
              let parsedOutput: any = ideateStage.output || '';
              try {
                parsedOutput = JSON.parse(ideateStage.output);
              } catch {
                // If parsing fails, it's the old format (just a string)
                parsedOutput = ideateStage.output || '';
              }
              setSavedData({
                input: parsedInput,
                output: parsedOutput,
                status: ideateStage.status,
              });
              if (
                parsedOutput?.pendingImprovementDirections &&
                Array.isArray(parsedOutput.pendingImprovementDirections?.directions) &&
                parsedOutput.pendingImprovementDirections.targetPillar
              ) {
                const pending = parsedOutput.pendingImprovementDirections;
                setPillarDirections({
                  [pending.targetPillar]: {
                    directions: pending.directions,
                    generatedAt: pending.generatedAt || new Date().toISOString(),
                  },
                });
                setPillarDirectionErrors({});
              }
              if (parsedOutput?.refinedOverview) {
                setRefinedOverview(parsedOutput.refinedOverview as ProductOverview);
              }
              if (Array.isArray(parsedOutput?.improvementIterations)) {
                const normalizedIterations = (parsedOutput.improvementIterations as any[]).map((item, index) => {
                  const differences = Array.isArray(item?.differences) ? item.differences : [];
                  return {
                    id: item?.id ?? `iteration-${index}`,
                    pillar: item?.pillarImpacted || item?.pillar || `iteration-${index}`,
                    scoreDelta:
                      typeof item?.scoreDelta === "number"
                        ? item.scoreDelta
                        : typeof item?.expectedScoreIncrease === "number"
                        ? item.expectedScoreIncrease
                        : null,
                    differences,
                    beforeSection: item?.beforeSection ?? differences[0]?.before,
                    afterSection: item?.afterSection ?? differences[0]?.after,
                    improvedOverview: (item?.improvedOverview || item?.finalOverview || parsedOutput.refinedOverview || null) as ProductOverview,
                    createdAt: item?.createdAt || new Date().toISOString(),
                    source: item?.source,
                  } as ImprovementLogEntry;
                });
                setImprovementLog(normalizedIterations);
              }
            } catch (e) {
              console.error('Error parsing saved input:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setIsLoadingSavedData(false);
      }
    };

    loadSavedData();
  }, [projectId]);

  useEffect(() => {
    loadImprovementHistory();
  }, [loadImprovementHistory]);

  // Clean description by removing redundant prefixes and preserving markdown
  const cleanDescription = (description: string): string => {
    let cleaned = description.trim();
    
    // Remove common redundant prefixes (case-insensitive)
    const prefixes = [
      /^detailed\s+description:?\s*/i,
      /^description:?\s*/i,
      /^overview:?\s*/i,
      /^summary:?\s*/i,
      /^idea\s+description:?\s*/i,
    ];
    
    for (const prefix of prefixes) {
      cleaned = cleaned.replace(prefix, '');
    }
    
    // Check if content already has markdown structure (headings, lists, etc.)
    const hasMarkdown = /^#{1,6}\s|^[\-\*]\s|^\d+\.\s/m.test(cleaned);
    
    if (hasMarkdown) {
      // Preserve markdown formatting - ensure proper spacing
      // Don't modify markdown structure, just clean up extra whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    } else {
      // No markdown detected - add intelligent paragraph breaks
      // Split on sentence boundaries for very long paragraphs
      const sentences = cleaned.split(/([.!?]\s+)/);
      let formatted = '';
      let currentParagraph = '';
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i] + (sentences[i + 1] || '');
        currentParagraph += sentence;
        
        // Start new paragraph after ~150 characters or at natural breaks
        if (currentParagraph.length > 150 && /[.!?]\s+$/.test(currentParagraph)) {
          formatted += currentParagraph.trim() + '\n\n';
          currentParagraph = '';
        }
      }
      
      if (currentParagraph.trim()) {
        formatted += currentParagraph.trim();
      }
      
      // If we created paragraphs, use them; otherwise keep original
      if (formatted.split('\n\n').length > 1) {
        cleaned = formatted.trim();
      }
    }
    
    return cleaned.trim();
  };

  // Parse AI response to extract ideas
  const parseIdeasFromResponse = (response: string): GeneratedIdea[] => {
    const ideas: GeneratedIdea[] = [];
    
    // Try to match numbered list format: "1. [Title] - [Tagline]\n[Description]"
    const numberedPattern = /(\d+)\.\s*([^\n-]+)\s*-\s*([^\n]+)\n([\s\S]*?)(?=\d+\.|$)/g;
    let match;
    let matchCount = 0;
    
    // Parse all ideas (no hardcoded limit - respect what AI generates)
    while ((match = numberedPattern.exec(response)) !== null) {
      const title = match[2].trim();
      const tagline = match[3].trim();
      let description = match[4].trim();
      
      // Clean description and preserve markdown
      description = cleanDescription(description);
      
      ideas.push({
        id: `idea-${matchCount + 1}`,
        title: `${title} - ${tagline}`,
        description: description
      });
      matchCount++;
    }
    
    // If numbered pattern didn't work, try alternative patterns
    if (ideas.length === 0) {
      // Try pattern with just title and description separated by newlines
      const sections = response.split(/\n\n+/);
      // Parse all sections (no hardcoded limit - respect what AI generates)
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length > 20) {
          const lines = section.split('\n');
          const title = lines[0].replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
          // Preserve newlines instead of joining with spaces to maintain markdown
          const description = lines.slice(1).join('\n').trim() || section;
          
          if (title && description) {
            let cleanedDescription = cleanDescription(description);
            ideas.push({
              id: `idea-${i + 1}`,
              title: title.substring(0, 100),
              description: cleanedDescription
            });
          }
        }
      }
    }
    
    // Fallback: if still no ideas, create one from the whole response
    if (ideas.length === 0 && response.trim().length > 50) {
      const firstLine = response.split('\n')[0].trim();
      let cleanedDescription = cleanDescription(response);
      ideas.push({
        id: 'idea-1',
        title: firstLine.substring(0, 100) || 'Generated Idea',
        description: cleanedDescription
      });
    }
    
    return ideas;
  };

  // Component for clean, well-formatted idea description with Markdown support
  const IdeaDescription = ({ 
    description, 
    ideaId, 
    isExpanded, 
    onToggleExpand 
  }: { 
    description: string; 
    ideaId: string; 
    isExpanded: boolean; 
    onToggleExpand: () => void;
  }) => {
    // Try to truncate at paragraph boundaries for better markdown handling
    const MAX_LENGTH = 400;
    const needsTruncation = description.length > MAX_LENGTH;
    
    let displayText = description;
    if (!isExpanded && needsTruncation) {
      // Try to find a good truncation point (end of a paragraph or section)
      const truncatePoint = description.lastIndexOf('\n\n', MAX_LENGTH);
      if (truncatePoint > MAX_LENGTH * 0.5) {
        // Use paragraph boundary if it's not too early
        displayText = description.substring(0, truncatePoint) + '...';
      } else {
        // Fall back to character limit
        displayText = description.substring(0, MAX_LENGTH) + '...';
      }
    }

    return (
      <div className="space-y-3">
        <div className="prose prose-sm max-w-none text-neutral-700">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-neutral-900 mt-4 mb-2 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mt-3 mb-1.5">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-base leading-7 mb-2 last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-none pl-0 space-y-1.5 my-2">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-2.5 text-sm leading-6">
                  <span className="text-purple-600 mt-1 shrink-0 font-bold">•</span>
                  <span className="flex-1">{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-neutral-900">
                  {children}
                </strong>
              ),
            }}
          >
            {displayText}
          </ReactMarkdown>
        </div>
        
        {needsTruncation && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-1"
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Read More</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Generate ideas function - now supports all modes (idempotent, now with AI)
  const generateIdeas = async () => {
    // For non-surprise-me modes, only generate if we haven't already
    if (selectedMode !== "surprise-me" && (ideasGenerated || generatedIdeas.length > 0)) {
      return;
    }
    // For surprise-me, keep existing check
    if (selectedMode === "surprise-me" && (ideasGenerated || generatedIdeas.length > 0)) {
      return;
    }

    setIsGeneratingIdeas(true);
    setIdeaGenerationError(null);

    try {
      // Build constraints from optional fields
      const constraints: string[] = [];
      if (budget) constraints.push(`Budget: ${budget}`);
      if (timescales) constraints.push(`Timeline: ${timescales}`);
      if (targetCountry) constraints.push(`Target Country: ${targetCountry}`);
      
      // Determine the mode string for the API
      let apiMode: string;
      if (selectedMode === "explore-idea") {
        apiMode = "Idea to Explore";
      } else if (selectedMode === "solve-problem") {
        apiMode = "Problem to Solve";
      } else {
        apiMode = "Surprise Me";
      }
      
      const response = await fetch('/api/ai/ideate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: apiMode,
          market: targetMarket || null,
          input: selectedMode !== "surprise-me" ? userInput : null,
          constraints: constraints.length > 0 ? constraints.join(', ') : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      const aiResponse = data.result || '';
      
      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty response from AI');
      }

      // Parse the AI response into ideas
      const parsedIdeas = parseIdeasFromResponse(aiResponse);
      
      if (parsedIdeas.length === 0) {
        throw new Error('Could not parse ideas from AI response');
      }

      // Use exactly what the AI generated - respect admin configuration
      setGeneratedIdeas(parsedIdeas);
      setIdeasGenerated(true);
    } catch (error) {
      console.error('Error generating ideas:', error);
      setIdeaGenerationError(error instanceof Error ? error.message : 'Failed to generate ideas');
      
      // Fallback to mock ideas only for surprise-me mode
      if (selectedMode === "surprise-me") {
        setGeneratedIdeas(mockIdeas);
        setIdeasGenerated(true);
      }
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && selectedMode) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedMode === "surprise-me") {
        // Auto-generate ideas when moving to Step 3 for "surprise-me" mode
        await generateIdeas();
        setCurrentStep(3);
      } else if (selectedMode && userInput.trim()) {
        // For "explore-idea" and "solve-problem" modes, also generate ideas
        await generateIdeas();
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Extract key insights from user input
  const extractKeyThemes = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    const meaningfulWords = words.filter(w => w.length > 4 && !commonWords.has(w));
    return meaningfulWords.slice(0, 5);
  };

  // Extract specific phrases and concepts from user input
  const extractSpecificInsights = (text: string) => {
    const lower = text.toLowerCase();
    const insights = {
      keyPhrases: [] as string[],
      mentionedUsers: [] as string[],
      mentionedProblems: [] as string[],
      mentionedSolutions: [] as string[],
      mentionedTech: [] as string[],
      mentionedMarket: [] as string[],
    };

    // Extract sentences that might be key quotes
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    insights.keyPhrases = sentences.slice(0, 3).map(s => s.trim());

    // Extract user types mentioned
    const userPatterns = /\b(users?|customers?|clients?|businesses?|companies?|people|individuals?|professionals?|consumers?|developers?|designers?|managers?|entrepreneurs?|students?|teachers?|patients?|doctors?|freelancers?)\b/gi;
    const userMatches = text.match(userPatterns);
    if (userMatches) {
      insights.mentionedUsers = [...new Set(userMatches.map(m => m.toLowerCase()))].slice(0, 3);
    }

    // Extract problem indicators
    const problemPatterns = /\b(problem|issue|pain|challenge|difficulty|struggle|frustrat|annoy|waste|inefficient|slow|complicated|confusing|hard|difficult|broken|missing|lack|need|want|desire)\b/gi;
    const problemMatches = text.match(problemPatterns);
    if (problemMatches) {
      insights.mentionedProblems = [...new Set(problemMatches.map(m => m.toLowerCase()))].slice(0, 3);
    }

    // Extract solution indicators
    const solutionPatterns = /\b(solution|solve|address|fix|help|improve|create|build|develop|automate|streamline|simplify|enhance|optimize|enable|provide|offer|deliver)\b/gi;
    const solutionMatches = text.match(solutionPatterns);
    if (solutionMatches) {
      insights.mentionedSolutions = [...new Set(solutionMatches.map(m => m.toLowerCase()))].slice(0, 3);
    }

    // Extract tech mentions
    const techPatterns = /\b(app|application|platform|software|system|tool|website|api|ai|artificial intelligence|machine learning|ml|algorithm|automation|cloud|saas|mobile|web|digital|online|tech|technology)\b/gi;
    const techMatches = text.match(techPatterns);
    if (techMatches) {
      insights.mentionedTech = [...new Set(techMatches.map(m => m.toLowerCase()))].slice(0, 3);
    }

    // Extract market/industry mentions
    const marketPatterns = /\b(market|industry|sector|space|niche|vertical|domain|field|area|business|commercial|enterprise|b2b|b2c|consumer|retail|healthcare|fintech|edtech|saas|ecommerce|retail)\b/gi;
    const marketMatches = text.match(marketPatterns);
    if (marketMatches) {
      insights.mentionedMarket = [...new Set(marketMatches.map(m => m.toLowerCase()))].slice(0, 3);
    }

    return insights;
  };

  const modeDescriptor =
    selectedMode === "explore-idea"
      ? "idea description"
      : selectedMode === "solve-problem"
        ? "problem statement"
        : "input";

  // Generate mock AI review based on the user's input
  const generateMockReview = () => {
    if (selectedMode === "surprise-me") {
      const selectedIdea = generatedIdeas.find((idea) => idea.id === selectedIdeaId);
      const ideaTitle = selectedIdea?.title || "Selected Idea";
      const ideaDesc = selectedIdea?.description || "";
      
      // Extract domain/keywords from the idea
      const isRemoteWork = ideaTitle.toLowerCase().includes('remote') || ideaDesc.toLowerCase().includes('remote') || ideaDesc.toLowerCase().includes('team');
      const isEco = ideaTitle.toLowerCase().includes('eco') || ideaTitle.toLowerCase().includes('carbon') || ideaDesc.toLowerCase().includes('sustainability');
      const isHealth = ideaTitle.toLowerCase().includes('health') || ideaDesc.toLowerCase().includes('health') || ideaDesc.toLowerCase().includes('medical');
      
      let domain = "technology";
      let marketSize = "substantial";
      let competitionLevel = "moderate";
      
      if (isRemoteWork) {
        domain = "remote work and collaboration";
        marketSize = "very large ($50B+ market)";
        competitionLevel = "high (many existing solutions)";
      } else if (isEco) {
        domain = "sustainability and environmental tech";
        marketSize = "rapidly growing ($30B+ market)";
        competitionLevel = "moderate to high";
      } else if (isHealth) {
        domain = "healthcare technology";
        marketSize = "massive ($200B+ market)";
        competitionLevel = "high (heavily regulated)";
      }

      // Build strengths list
      const strengthsList = [];
      if (ideaDesc.toLowerCase().includes('ai') || ideaDesc.toLowerCase().includes('artificial intelligence')) {
        strengthsList.push('- **AI Integration**: Leveraging AI for automation/personalization is a strong competitive advantage in today\'s market');
      }
      if (ideaDesc.toLowerCase().includes('platform') || ideaDesc.toLowerCase().includes('marketplace')) {
        strengthsList.push('- **Platform Potential**: The platform/marketplace model has proven scalability and network effects');
      }
      if (ideaDesc.toLowerCase().includes('subscription') || ideaDesc.toLowerCase().includes('monthly')) {
        strengthsList.push('- **Recurring Revenue Model**: Subscription model provides predictable revenue and strong unit economics');
      }
      strengthsList.push('- **Clear Problem-Solution Fit**: The idea directly addresses a specific, articulated need');
      strengthsList.push('- **Scalable Architecture**: The concept appears designed for growth without linear cost increases');
      const strengthsText = strengthsList.join('\n');

      return `**AI Review: ${ideaTitle}**

**Overall Assessment:**
${ideaDesc}

After analyzing this concept in depth, I can see this is targeting the ${domain} space. The ${marketSize} presents significant opportunities, though you'll need to differentiate clearly given the ${competitionLevel} competition level.

**Specific Observations About Your Idea:**

${isRemoteWork ? 
`**Market Context**: The remote work collaboration market has exploded post-2020, with tools like Slack, Microsoft Teams, and Notion dominating. However, your focus on ${ideaDesc.toLowerCase().includes('async') ? 'asynchronous collaboration' : 'AI-powered solutions'} addresses a real gap - most tools are built for real-time sync, not async-first workflows.

**Unique Value Angle**: What stands out is ${ideaDesc.toLowerCase().includes('timezone') ? 'the timezone-agnostic approach' : 'the AI-powered automation'}. This could be a key differentiator if executed well.` :
isEco ?
`**Market Context**: The carbon tracking and sustainability tech space is experiencing rapid growth, driven by increasing ESG regulations and consumer consciousness. Companies like Watershed and Patch are gaining traction, but the personal/individual market is less saturated.

**Unique Value Angle**: The personal carbon footprint focus combined with ${ideaDesc.toLowerCase().includes('marketplace') ? 'an offset marketplace' : 'actionable recommendations'} creates a complete solution loop. Users can both understand their impact and take immediate action.` :
isHealth ?
`**Market Context**: Healthcare tech is one of the most complex but rewarding markets. The preventive health space is less crowded than diagnostic tools, and there's growing consumer demand for proactive health management.

**Unique Value Angle**: The AI-powered preventive approach is smart - focusing on prevention rather than treatment aligns with value-based healthcare trends. The challenge will be medical accuracy and regulatory compliance.` :
`**Market Context**: This concept shows innovation in addressing a real market need. The timing appears favorable for solutions in this space.

**Unique Value Angle**: The core value proposition addresses a specific pain point that existing solutions may not fully solve.`}

**Strengths I've Identified:**

${strengthsText}

**Critical Areas Needing Validation:**

1. **Customer Willingness to Pay**: ${budget ? `Given your budget of ${budget}, you'll need to validate that customers will pay enough to cover costs.` : 'You need to determine if customers will pay for this solution at a price point that makes the business viable.'} Research similar solutions' pricing and conduct willingness-to-pay surveys.

2. **Market Timing**: ${timescales ? `Your timeline of ${timescales} is ${timescales.includes('month') && parseInt(timescales) <= 6 ? 'aggressive but achievable for an MVP' : 'reasonable for a full launch'}.` : 'The market timing question is crucial.'} ${isRemoteWork ? 'Remote work tools are mature, so differentiation is key.' : isEco ? 'Sustainability tech is hot right now - good timing.' : isHealth ? 'Healthcare tech moves slowly due to regulations - factor in longer timelines.' : 'Assess whether the market is ready for this solution.'}

3. **Competitive Differentiation**: ${targetMarket ? `In the ${targetMarket} market,` : 'In this market,'} you'll face established players. Your unique angle needs to be substantial enough to justify switching costs.

4. **User Acquisition**: ${targetCountry ? `For ${targetCountry},` : 'The'} acquisition strategy needs to be clear from day one. ${isRemoteWork ? 'B2B SaaS typically requires sales teams or strong inbound marketing.' : isEco ? 'Consumer sustainability apps often rely on viral growth and content marketing.' : isHealth ? 'Healthcare products require trust-building and often partnerships with healthcare providers.' : 'Define your acquisition channels early.'}

**Market-Specific Insights:**

${targetMarket ? `**${targetMarket} Market Analysis**: The ${targetMarket} sector is ` : '**Market Analysis**: The target market is '}${targetMarket === 'Healthcare' ? 'highly regulated but offers massive opportunities for innovation. Regulatory compliance will be a key consideration.' : targetMarket === 'Fintech' ? 'rapidly evolving with strong investor interest. Financial regulations (PCI, KYC) will be important.' : targetMarket === 'EdTech' ? 'growing significantly, especially in personalized learning solutions. Educational institutions move slowly but have large budgets.' : 'receptive to innovative solutions. The key is understanding the specific pain points and decision-making processes.'}

${targetCountry ? `**${targetCountry} Market Context**: ` : '**Geographic Considerations**: '}${targetCountry === 'United States' ? 'The US market is large but competitive. Consider starting in a specific region or niche before scaling nationwide.' : targetCountry === 'United Kingdom' ? 'The UK market is smaller but often easier to penetrate. GDPR compliance is essential for any data-handling features.' : targetCountry === 'Global' ? 'A global approach requires careful localization and understanding of different market needs. Consider starting in one market first.' : 'Market-specific factors will influence your go-to-market strategy.'}

**Recommendations Based on Your Input:**

${budget && parseInt(budget.replace(/[^0-9]/g, '')) < 10000 ? 
`1. **Lean MVP Approach**: With a ${budget} budget, focus on building the absolute minimum viable product. Use no-code tools, leverage APIs, and prioritize one core feature that demonstrates value.

2. **Bootstrap Strategy**: Given your budget constraints, consider a bootstrapped approach. Focus on organic growth and customer-funded development rather than seeking investment initially.` :
budget && parseInt(budget.replace(/[^0-9]/g, '')) >= 50000 ?
`1. **Investment in Core Features**: With a ${budget} budget, you can invest in building a more robust MVP with core features that demonstrate clear value.

2. **Consider Pre-Seed Funding**: This budget level suggests you might be considering external funding. Prepare a clear pitch deck showing traction and market validation.` :
`1. **MVP Development**: Build a focused MVP that tests your core value proposition without over-engineering.

2. **Resource Allocation**: Allocate resources wisely - prioritize features that directly address your core problem-solution fit.`}

3. **Validation Strategy**: ${userInput.length > 100 ? `Based on your ${modeDescriptor}, I recommend conducting at least 10-15 customer interviews to validate the core assumptions. Focus on: "Would you pay for this?" and "How do you currently solve this problem?"` : 'Start with customer interviews to validate your core assumptions.'}

4. **Technical Considerations**: ${ideaDesc.toLowerCase().includes('ai') ? 'AI features will require significant data and potentially ML expertise. Consider starting with rule-based solutions before moving to full AI.' : 'Consider the technical complexity and ensure you have the right expertise to build this.'}

**Next Steps Prioritized:**

1. **Week 1-2**: ${userInput ? 'Refine your idea based on this analysis. Specifically, focus on' : 'Define'} the one core feature that demonstrates value.

2. **Week 3-4**: Conduct 10 customer interviews ${targetMarket ? `in the ${targetMarket} space` : ''} to validate problem-solution fit.

3. **Month 2**: ${timescales ? `Given your ${timescales} timeline,` : 'Begin'} building the MVP with focus on the core value proposition.

4. **Month 3+**: ${timescales && timescales.includes('month') && parseInt(timescales) >= 6 ? 'Launch beta and gather user feedback. Iterate based on real usage data.' : 'Start user testing and iterate based on feedback.'}

**Final Assessment:**

This idea shows ${ideaDesc.length > 100 ? 'strong potential based on your detailed description' : 'promise'}. The ${domain} market ${isRemoteWork ? 'is mature but offers differentiation opportunities' : isEco ? 'is growing rapidly with strong tailwinds' : isHealth ? 'requires careful navigation but offers massive rewards' : 'presents good opportunities'}.

**My Recommendation**: ${selectedIdeaId ? 'This selected idea' : 'This idea'} is worth pursuing, but ${budget ? `with a ${budget} budget,` : ''} focus heavily on validation before significant development. The ${competitionLevel} competition means you need a clear, defensible advantage.

**Risk Level**: ${isHealth ? 'Medium-High (regulatory complexity)' : isRemoteWork ? 'Medium (saturated market, need strong differentiation)' : isEco ? 'Medium (growing market, but need to prove willingness to pay)' : 'Medium (standard startup risks)'}

**Success Probability**: With proper validation and execution, I'd estimate ${isRemoteWork ? '25-35%' : isEco ? '30-40%' : isHealth ? '20-30%' : '30-40%'} chance of building a viable business. The key is rapid iteration and customer feedback.`;
    } else {
      const inputType = selectedMode === "explore-idea" ? "idea" : "problem";
      const insights = extractSpecificInsights(userInput);
      const themes = extractKeyThemes(userInput);
      const inputLength = userInput.length;
      const hasSpecificDetails = inputLength > 200;
      
      // Get a representative quote from their input (first meaningful sentence)
      const firstSentence = userInput.split(/[.!?]+/).find(s => s.trim().length > 30) || userInput.substring(0, 100);
      const quote = firstSentence.trim() + (firstSentence.length < userInput.length ? '...' : '');
      
      return `**AI Review: Your ${inputType === "idea" ? "Idea" : "Problem Statement"}**

**Overall Assessment:**

You've described: "${quote}"

${hasSpecificDetails ? 
`I've analyzed your ${inputLength} word description in detail. This isn't just a surface-level ${inputType} - you've provided substantial context that helps me understand the nuances.` : 
`Your description is concise but provides a clear starting point. To give you more specific feedback, I'd recommend expanding on the details below.`}

**What I Noticed in Your Description:**

${insights.mentionedUsers.length > 0 ? 
`**Target Audience**: You mentioned ${insights.mentionedUsers.join(', ')}. ${insights.mentionedUsers.length === 1 ? 'This is a focused target, which is good for validation.' : 'These are distinct user groups - consider if they have different needs or if you should focus on one first.'}` : 
'**Target Audience**: Your description doesn\'t clearly specify who this ${inputType === "idea" ? "is for" : "affects"}. Identifying the specific user persona is critical for validation.'}

${insights.mentionedProblems.length > 0 ? 
`**Problem Indicators**: You used words like "${insights.mentionedProblems.join('", "')}" which suggests you're identifying ${inputType === "problem" ? "a real pain point" : "a problem worth solving"}. ${insights.mentionedProblems.includes('frustrat') || insights.mentionedProblems.includes('difficult') ? 'The emotional language indicates this is a significant pain point for users.' : 'Consider diving deeper into how severe this problem is for your target users.'}` : 
inputType === "problem" ? 
'**Problem Severity**: Your problem description could be more specific about the severity and frequency of the issue.' : 
'**Problem Clarity**: For an idea, consider clearly articulating what problem it solves.'}

${insights.mentionedSolutions.length > 0 ? 
`**Solution Approach**: You mentioned ${insights.mentionedSolutions.join(', ')} which shows you're thinking about how to ${inputType === "idea" ? "address" : "solve"} this. ${insights.mentionedSolutions.includes('automate') || insights.mentionedSolutions.includes('streamline') ? 'Automation/streamlining suggests efficiency gains - quantify these if possible.' : insights.mentionedSolutions.includes('create') || insights.mentionedSolutions.includes('build') ? 'Building something new suggests innovation - what makes your approach different?' : ''}` : 
'**Solution Clarity**: ${inputType === "idea" ? "Your idea is clear" : "Consider outlining potential solution approaches"}.'}

${insights.mentionedTech.length > 0 ? 
`**Technology Stack**: You're considering ${insights.mentionedTech.join(', ')}. ${insights.mentionedTech.includes('ai') || insights.mentionedTech.includes('artificial intelligence') ? 'AI/ML features can be powerful differentiators but require significant data and expertise. Consider starting with rule-based logic before moving to full AI.' : insights.mentionedTech.includes('platform') || insights.mentionedTech.includes('marketplace') ? 'Platform/marketplace models have network effects but require reaching critical mass. Plan for how you\'ll attract initial users.' : insights.mentionedTech.includes('app') || insights.mentionedTech.includes('mobile') ? 'Mobile apps require app store approval and face discovery challenges. Consider web-first or hybrid approaches.' : 'Consider the technical complexity and whether you have (or can acquire) the necessary expertise.'}` : 
'**Technical Approach**: Your description doesn\'t specify the technology or delivery method. Consider how users will interact with your solution.'}

${insights.mentionedMarket.length > 0 ? 
`**Market Context**: You mentioned ${insights.mentionedMarket.join(', ')} which helps situate this ${inputType} in a market context. ${insights.mentionedMarket.includes('b2b') ? 'B2B markets typically have longer sales cycles but higher contract values. Plan for enterprise sales processes.' : insights.mentionedMarket.includes('b2c') ? 'B2C markets move faster but require significant marketing spend. Consider viral growth mechanisms.' : insights.mentionedMarket.includes('niche') ? 'Niche markets can be profitable with less competition, but growth may be limited.' : ''}` : 
'**Market Positioning**: Consider which market or industry vertical this serves - this will help with competitive research and customer targeting.'}

${insights.keyPhrases.length > 0 ? 
`**Key Points from Your Description**:\n${insights.keyPhrases.map((phrase, i) => `- ${phrase}`).join('\n')}\n\nThese points suggest ${themes.length > 0 ? `a focus on ${themes.slice(0, 2).join(' and ')}` : 'several interconnected concepts'} that are worth exploring further.` : ''}

${inputType === "idea" ? (() => {
  const evalList = [];
  if (userInput.toLowerCase().includes('app') || userInput.toLowerCase().includes('platform') || userInput.toLowerCase().includes('software')) {
    evalList.push('- **Product Type**: You\'re considering a digital product (app/platform/software), which offers scalability and lower marginal costs.');
  }
  if (userInput.toLowerCase().includes('service') || userInput.toLowerCase().includes('consulting')) {
    evalList.push('- **Service Model**: A service-based approach allows for higher margins but requires more human resources to scale.');
  }
  if (userInput.toLowerCase().includes('marketplace') || userInput.toLowerCase().includes('platform')) {
    evalList.push('- **Network Effects**: The platform/marketplace model can create strong competitive moats through network effects.');
  }
  if (userInput.toLowerCase().includes('ai') || userInput.toLowerCase().includes('automation')) {
    evalList.push('- **Tech Innovation**: AI/automation features can differentiate your solution but require technical expertise and data.');
  }
  const evalText = evalList.join('\n');
  
  return `**Idea Evaluation**:
${evalText}

**Market Positioning**: ${targetMarket ? `In the ${targetMarket} market,` : 'In the market,'} ${userInput.length > 300 ? 'your idea addresses a specific need that appears underserved. The level of detail in your description suggests you\'ve thought through the core value proposition.' : 'your idea needs clearer positioning against existing solutions.'}`;
})() :
`**Problem Analysis**:
${insights.mentionedProblems.length > 0 ? '- **Problem Severity**: Your description indicates this is a ' : '- **Problem Definition**: To better assess, consider: '}${userInput.toLowerCase().includes('frustrat') || userInput.toLowerCase().includes('difficult') || userInput.toLowerCase().includes('pain') ? 'significant pain point that users actively experience.' : userInput.toLowerCase().includes('need') || userInput.toLowerCase().includes('want') ? 'recognized need in the market.' : 'challenge worth addressing.'}
${insights.mentionedUsers.length > 0 ? '- **Affected Audience**: You\'ve identified who experiences this problem, which is crucial for validation.' : '- **Target Audience**: Clarify who specifically experiences this problem - is it consumers, businesses, or a specific demographic?'}
${userInput.toLowerCase().includes('current') || userInput.toLowerCase().includes('existing') || userInput.toLowerCase().includes('today') ? '- **Current Solutions**: You acknowledge existing approaches, which shows market awareness.' : '- **Current Solutions**: Research what solutions exist today - understanding the competitive landscape is critical.'}

**Solution Opportunities**: ${userInput.length > 250 ? 'Your problem statement is detailed enough to suggest multiple solution directions. The key is finding the approach that balances user needs, technical feasibility, and business viability.' : 'Based on this problem, there are likely several solution approaches. Consider which aligns best with your skills and resources.'}`}

**Strengths I've Identified:**

${userInput.length > 150 ? `- **Depth of Detail**: Your ${inputLength} word description shows you've thought beyond surface level. This gives us concrete details to analyze rather than vague concepts.` : '- **Clarity**: Your description is clear and focused, which is a good starting point.'}
${insights.mentionedUsers.length > 0 ? `- **Audience Clarity**: You've identified ${insights.mentionedUsers.join(' and ')} as your target, which is crucial for validation.` : ''}
${insights.mentionedProblems.length > 0 && inputType === "problem" ? `- **Problem-First Approach**: Starting with the problem (you mentioned ${insights.mentionedProblems.join(', ')}) is the right methodology - problems are easier to validate than solutions.` : insights.mentionedSolutions.length > 0 ? `- **Solution-Oriented**: You're already thinking about ${insights.mentionedSolutions.join(' and ')}, which shows forward-thinking.` : ''}
${insights.mentionedTech.length > 0 ? `- **Technical Vision**: Mentioning ${insights.mentionedTech.join(' and ')} shows you've considered the delivery mechanism.` : ''}
${hasSpecificDetails ? `- **Research Quality**: The level of detail (${inputLength} words) suggests you've done some initial thinking or research about this ${inputType}.` : ''}
- **Actionable Foundation**: This ${inputType} gives you a concrete starting point to build upon

**Critical Questions Based on What You've Told Me:**

1. **Market Size**: ${targetMarket ? `You've specified ${targetMarket} as your target market.` : insights.mentionedMarket.length > 0 ? `You've mentioned ${insights.mentionedMarket.join(' and ')} in your description.` : 'Your description doesn\'t specify the market size.'} ${userInput.toLowerCase().includes('small') || userInput.toLowerCase().includes('niche') ? 'You mentioned this is a niche/small market - that can reduce competition but limit growth. What\'s the realistic total addressable market?' : 'What\'s the total addressable market? Even if it seems small, quantify it.'}

2. **Willingness to Pay**: ${budget ? `You mentioned a budget of ${budget}.` : ''} ${userInput.toLowerCase().includes('free') || userInput.toLowerCase().includes('cheap') || userInput.toLowerCase().includes('affordable') ? 'You\'ve indicated this should be free or low-cost. How will you monetize sustainably? Consider freemium models or alternative revenue streams.' : insights.mentionedUsers.length > 0 ? `Will ${insights.mentionedUsers[0]} actually pay for this? ${insights.mentionedProblems.length > 0 ? `The ${insights.mentionedProblems[0]} you mentioned - is it severe enough that people will pay to solve it?` : 'Validate that the pain point justifies payment.'}` : 'Will people pay for this solution? Validate willingness to pay early.'}

3. **Competitive Differentiation**: ${userInput.toLowerCase().includes('unique') || userInput.toLowerCase().includes('first') || userInput.toLowerCase().includes('no one') ? 'You believe this is unique or first-to-market. Thorough competitive research is essential - similar solutions may exist in adjacent markets or with different positioning.' : 'Research existing solutions thoroughly. Even if they don\'t solve it exactly your way, they\'re competitors.'} ${insights.mentionedTech.length > 0 ? `Given you're considering ${insights.mentionedTech[0]}, look for competitors using similar technology approaches.` : ''}

4. **Execution Feasibility**: ${timescales ? `You've set a timeline of ${timescales}.` : ''} ${userInput.toLowerCase().includes('ai') || userInput.toLowerCase().includes('artificial intelligence') || userInput.toLowerCase().includes('machine learning') ? 'You mentioned AI/ML - this requires significant data, expertise, and longer development cycles. Factor in 2-3x longer timelines than initially estimated.' : userInput.toLowerCase().includes('complex') || userInput.toLowerCase().includes('complicated') ? 'You mentioned complexity - break this down into phases and validate the MVP first before building the full solution.' : ''} Can you realistically build and launch this ${timescales ? `within ${timescales}` : 'in a reasonable timeframe'}? ${insights.mentionedTech.length > 0 ? `Do you have the expertise to build with ${insights.mentionedTech.join(' and ')}?` : 'Consider your team\'s capabilities and available resources.'}

**Recommendations Tailored to Your Input:**

${inputLength < 100 ? 
`1. **Expand Your ${inputType === "idea" ? "Idea" : "Problem"} Description**: Your current description is brief. Flesh out:
   - Who specifically experiences this ${inputType === "idea" ? "need" : "problem"}?
   - How frequently do they encounter it?
   - What are the current workarounds or solutions?
   - What would an ideal solution look like?` :
`1. **Validate Your Core Assumption**: Based on your ${inputLength > 200 ? 'detailed' : ''} description, the key assumption to validate is whether ${inputType === "idea" ? 'users actually want this solution' : 'this problem is severe enough that people will pay to solve it'}.`}

2. **Market Research Deep Dive**: ${targetMarket ? `Focus your research on the ${targetMarket} sector specifically.` : 'Research the market broadly first, then narrow to your specific niche.'} ${targetCountry ? `In ${targetCountry},` : ''} Look for:
   - Direct competitors solving the same ${inputType === "idea" ? "need" : "problem"}
   - Adjacent solutions that could be modified
   - Market size and growth trends
   - Pricing models of similar solutions

3. **MVP Scope Definition**: ${userInput.toLowerCase().includes('feature') ? 'You mentioned features - prioritize the ONE feature that demonstrates core value.' : `Based on your ${inputType},`} Your MVP should test: ${inputType === "idea" ? "Would people use this? Would they pay for it?" : "Does this problem exist? How do people solve it today?"}

4. **Customer Development**: ${userInput.length > 200 ? `Given your detailed description (${inputLength} words), you clearly understand the space. Now validate with real ${insights.mentionedUsers.length > 0 ? insights.mentionedUsers[0] : 'users'}.` : 'Start talking to potential users immediately.'} ${targetMarket ? `Target people in ${targetMarket} specifically.` : insights.mentionedUsers.length > 0 ? `Target ${insights.mentionedUsers[0]} specifically.` : ''} ${inputType === "problem" && insights.mentionedProblems.length > 0 ? `Ask about the ${insights.mentionedProblems[0]} you mentioned:` : 'Ask:'}
   ${inputType === "problem" ? `- "Tell me about the last time you experienced [this problem]"\n   - "How did you solve it?"\n   - "What would a perfect solution look like?"` : `- "Would you use a solution that ${insights.mentionedSolutions.length > 0 ? insights.mentionedSolutions[0] + 's' : 'solves this'}?"\n   - "How do you currently handle this?"`}
   - "Would you pay $X for this?"

**Market-Specific Insights:**

${targetMarket ? `**${targetMarket} Sector Analysis**: ` : '**Market Context**: '}${targetMarket === 'Healthcare' ? 'Healthcare is highly regulated but offers massive opportunities. Consider HIPAA compliance, FDA regulations (if applicable), and the long sales cycles typical in healthcare.' : targetMarket === 'Fintech' ? 'Fintech requires navigating complex regulations (PCI-DSS, KYC/AML). However, the market is large and investors are active. Focus on security and compliance from day one.' : targetMarket === 'EdTech' ? 'EdTech has long sales cycles but large contract values. Educational institutions move slowly, so plan for 6-12 month sales cycles. Consider freemium models for consumer EdTech.' : targetMarket === 'SaaS' || targetMarket === 'Software' ? 'SaaS has proven unit economics but high competition. Differentiation is key. Focus on a specific niche before expanding.' : 'This market has specific characteristics that will influence your strategy.'}

${targetCountry ? `**${targetCountry} Market Considerations**: ` : '**Geographic Factors**: '}${targetCountry === 'United States' ? 'The US market is large but competitive. Consider starting regionally or in a specific niche. Also consider: state-by-state regulations, cultural differences across regions, and the need for strong marketing to stand out.' : targetCountry === 'United Kingdom' ? 'The UK market is smaller but often easier to penetrate. GDPR compliance is essential. Consider the impact of Brexit on regulations and market access.' : targetCountry === 'Global' ? 'A global approach requires careful localization. Consider starting in one market (likely English-speaking) before expanding. Factor in: currency, regulations, cultural differences, and localization costs.' : 'Market-specific factors will shape your go-to-market strategy.'}

${budget ? `**Budget Considerations (${budget})**: ` : '**Resource Planning**: '}${budget.toLowerCase().includes('bootstrapped') || budget.toLowerCase().includes('0') || (budget.match(/\d+/) && parseInt(budget.match(/\d+/)?.[0] || '0') < 1000) ? 'With limited budget, prioritize: 1) No-code/low-code solutions, 2) Leverage existing APIs and tools, 3) Focus on one core feature, 4) Use free marketing channels, 5) Consider pre-orders or crowdfunding to fund development.' : budget.match(/\d+/) && parseInt(budget.match(/\d+/)?.[0] || '0') >= 10000 ? `With a ${budget} budget, you can invest in: 1) Professional development, 2) Marketing and user acquisition, 3) Legal/compliance setup, 4) Initial infrastructure. Still focus on MVP first, but you have more runway.` : 'Allocate resources wisely - prioritize validation and MVP development over perfection.'}

${timescales ? `**Timeline Reality Check (${timescales})**: ` : '**Development Timeline**: '}${timescales.toLowerCase().includes('month') && timescales.match(/\d+/) && parseInt(timescales.match(/\d+/)?.[0] || '0') <= 3 ? 'A 3-month timeline is aggressive for a full product. Focus on MVP with core features only. Consider what you can realistically build and validate in this timeframe.' : timescales.toLowerCase().includes('month') && timescales.match(/\d+/) && parseInt(timescales.match(/\d+/)?.[0] || '0') >= 6 ? 'A 6+ month timeline is more realistic for a comprehensive solution. This allows for: proper development, testing, iteration, and initial user acquisition.' : 'Factor in: development time, testing, iteration cycles, and user feedback incorporation. Most products take longer than initially planned.'}

**Next Steps Prioritized for Your Situation:**

**Week 1-2: Validation Phase**
- Conduct 10-15 customer interviews ${targetMarket ? `with people in ${targetMarket}` : ''}
- Research competitive landscape thoroughly
- ${userInput.length < 150 ? 'Refine and expand your idea/problem statement' : 'Synthesize feedback from interviews'}

**Week 3-4: Planning Phase**
- Define MVP scope (one core feature)
- ${budget ? `Create budget breakdown based on your ${budget} constraint` : 'Create detailed budget estimate'}
- ${timescales ? `Create ${timescales} timeline with milestones` : 'Create development timeline with milestones'}
- Identify technical requirements and needed expertise

**Month 2-3: Development Phase**
- Build MVP focusing on core value proposition
- Start user testing early (even with basic versions)
- Iterate based on feedback

**Month 4+: Launch & Iteration**
- Launch to early users/beta testers
- Gather quantitative and qualitative feedback
- Iterate rapidly based on what you learn
- Plan for scale (if validation successful)

**Final Assessment:**

${(() => {
  if (inputLength > 200) {
    const quotePreview = quote.substring(0, 80);
    let detailText = '';
    if (insights.keyPhrases.length > 0) {
      const keyPhrasePreview = insights.keyPhrases[0].substring(0, 60);
      detailText = `The key points you raised (like "${keyPhrasePreview}...")`;
    } else if (themes.length > 0) {
      detailText = `The focus on ${themes.slice(0, 2).join(' and ')}`;
    } else {
      detailText = 'The concepts you\'ve outlined';
    }
    const suggestion = inputType === "idea" ? "a well-considered opportunity" : "a genuine problem worth solving";
    return `Your ${inputLength} word description of "${quotePreview}..." shows you've put real thought into this. ${detailText} suggest ${suggestion}.`;
  } else {
    let foundationText = '';
    if (insights.mentionedUsers.length > 0 || insights.mentionedProblems.length > 0) {
      const userPart = insights.mentionedUsers.length > 0 ? insights.mentionedUsers[0] : '';
      const problemPart = insights.mentionedProblems.length > 0 ? `the ${insights.mentionedProblems[0]}` : '';
      const connector = insights.mentionedUsers.length > 0 && insights.mentionedProblems.length > 0 ? ' and ' : '';
      foundationText = `You've identified ${userPart}${connector}${problemPart} which is a solid foundation.`;
    } else {
      foundationText = 'With more development and validation, this could become a viable business opportunity.';
    }
    return `Your ${inputType} description is a good starting point. ${foundationText}`;
  }
})()}

**Overall Recommendation**: 
${inputLength > 150 && (insights.mentionedUsers.length > 0 || insights.mentionedMarket.length > 0) && (insights.mentionedProblems.length > 0 || insights.mentionedSolutions.length > 0) ? 
`This shows strong potential. You've clearly identified ${insights.mentionedUsers.length > 0 ? `your target (${insights.mentionedUsers[0]})` : 'a market'}, ${insights.mentionedProblems.length > 0 ? `the problem (${insights.mentionedProblems[0]})` : 'an opportunity'}, and ${insights.mentionedSolutions.length > 0 ? `a solution approach (${insights.mentionedSolutions[0]})` : 'potential solutions'}. The key is validating your assumptions before investing heavily in development.` : 
`This has potential but needs more development. ${inputLength < 100 ? 'Expand your description with more specific details.' : 'Focus on validating your core assumptions with real users.'} ${insights.mentionedUsers.length === 0 ? 'Start by clearly identifying who this is for.' : ''} ${insights.mentionedProblems.length === 0 && inputType === "problem" ? 'Articulate the problem more specifically.' : ''}`}

**Risk Assessment**: 
${inputType === "idea" ? 'Medium risk' : 'Lower risk (problem-first approach)'} - ${inputType === "idea" ? 'ideas need validation that people want them' : 'problems are easier to validate than solutions'}. ${budget && parseInt(budget.replace(/[^0-9]/g, '')) < 5000 ? `With your ${budget} budget, focus on validation before building. Use no-code tools and customer interviews to validate first.` : budget ? `Your ${budget} budget allows for some development, but validation should still come first.` : 'Focus on validation before significant development investment.'} ${insights.mentionedTech.length > 0 && (insights.mentionedTech.includes('ai') || insights.mentionedTech.includes('artificial intelligence')) ? 'The AI/ML components you mentioned add technical risk - ensure you have the expertise or can acquire it.' : ''}

**Success Probability**: 
With proper execution and validation, I'd estimate ${inputLength > 200 && (insights.mentionedUsers.length > 0 || insights.mentionedMarket.length > 0) ? '35-45%' : inputLength > 100 && insights.mentionedUsers.length > 0 ? '30-40%' : '25-35%'} chance of building a viable business. ${insights.mentionedUsers.length > 0 ? `The fact that you've identified ${insights.mentionedUsers[0]} is a positive sign - now validate they actually want this.` : 'The key will be in how well you validate and iterate based on customer feedback.'}

${targetMarket && targetCountry ? 
`**Specific Market Opportunity**: 
The ${targetMarket} market ${targetCountry === 'United States' ? 'in the US' : `in ${targetCountry}`} ${targetMarket === 'Healthcare' ? 'is massive but complex - your solution will need to navigate HIPAA and potentially FDA regulations' : targetMarket === 'Fintech' ? 'is growing rapidly with strong investor interest, but requires careful attention to PCI-DSS and KYC/AML compliance' : 'presents good opportunities'}. ${insights.mentionedUsers.length > 0 ? `Given you're targeting ${insights.mentionedUsers[0]},` : 'Focus on'} understanding the specific needs ${targetMarket === 'Healthcare' ? 'and regulatory requirements' : targetMarket === 'Fintech' ? 'and compliance frameworks' : ''} of this market.` : 
targetMarket ? 
`**Market Context**: 
The ${targetMarket} sector ${targetMarket === 'Healthcare' ? 'requires careful navigation of regulations but offers massive opportunities' : targetMarket === 'Fintech' ? 'has strong investor interest but requires compliance focus' : 'has specific characteristics'} that will influence your strategy. ${insights.mentionedUsers.length > 0 ? `Your target of ${insights.mentionedUsers[0]} in this market ${targetMarket === 'Healthcare' ? 'will need to trust your solution' : targetMarket === 'Fintech' ? 'will need to trust your security' : 'is a good starting point'}.` : ''}` : 
''}`;
    }
  };

  const handleFinish = async () => {
    setIsLoadingReview(true);
    setReviewError(null);
    setShowReview(true);
    
    let reviewText = '';
    
    try {
      // For all modes, get the selected idea if ideas were generated
      const selectedIdea = (ideasGenerated && selectedIdeaId) 
        ? generatedIdeas.find((idea) => idea.id === selectedIdeaId)
        : null;
      
      const response = await fetch('/api/ai/ideate/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: selectedMode,
          userInput: selectedMode !== "surprise-me" ? userInput : null,
          selectedIdea: selectedIdea || null,
          targetMarket: targetMarket || null,
          targetCountry: targetCountry || null,
          budget: budget || null,
          timescales: timescales || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI review');
      }

      const data = await response.json();
      reviewText = data.result || 'No review generated.';
      setAiReview(reviewText);
      
      // Log for debugging
      console.log("Wizard completed with:", {
        mode: selectedMode,
        userInput: selectedMode !== "surprise-me" ? userInput : null,
        selectedIdea: selectedIdeaId,
        advancedOptions: {
          targetMarket,
          targetCountry,
          budget,
          timescales,
        },
      });
    } catch (error) {
      console.error('Error generating AI review:', error);
      setReviewError(error instanceof Error ? error.message : 'Failed to generate AI review. Please try again.');
      // Fallback to mock review on error
      reviewText = generateMockReview();
      setAiReview(reviewText);
    } finally {
      setIsLoadingReview(false);
      
      // Only start initial feedback after AI review is fully complete
      if (reviewText) {
        // Automatically generate initial feedback after AI Review completes
        setIsLoadingInitialFeedback(true);
        try {
          // For all modes, get the selected idea if ideas were generated
          const selectedIdea = (ideasGenerated && selectedIdeaId) 
            ? generatedIdeas.find((idea) => idea.id === selectedIdeaId)
            : null;

          const feedbackResponse = await fetch('/api/ai/ideate/initial-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mode: selectedMode,
              userInput: selectedMode !== "surprise-me" ? userInput : null,
              selectedIdea: selectedIdea || null,
              targetMarket: targetMarket || null,
              targetCountry: targetCountry || null,
              budget: budget || null,
              timescales: timescales || null,
              aiReview: reviewText,
            }),
          });

          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            setInitialFeedback(feedbackData);
          } else {
            console.error('Failed to generate initial feedback');
            // Don't show error to user, just log it
          }
        } catch (feedbackError) {
          console.error('Error generating initial feedback:', feedbackError);
          // Don't show error to user, just log it
        } finally {
          setIsLoadingInitialFeedback(false);
        }
      }
    }
  };

  const handleCompleteWizard = async () => {
    if (!aiReview) {
      toast.error("Please complete the AI review first");
      return;
    }

    try {
      // Prepare data to save
      const selectedIdea = selectedMode === "surprise-me" && selectedIdeaId 
        ? generatedIdeas.find((idea) => idea.id === selectedIdeaId)
        : null;

      const inputData = {
        mode: selectedMode,
        userInput: selectedMode !== "surprise-me" ? userInput : null,
        selectedIdea: selectedIdea || null,
        targetMarket: targetMarket || null,
        targetCountry: targetCountry || null,
        budget: budget || null,
        timescales: timescales || null,
        ideaHistory: [],
      };

      // Prepare output with AI review and initial feedback
      const outputData = {
        aiReview: aiReview,
        initialFeedback: initialFeedback || null,
      };

      const response = await fetch(`/api/projects/${projectId}/stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: 'ideate',
          input: JSON.stringify(inputData),
          output: JSON.stringify(outputData),
          status: 'completed',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save idea');
      }

      toast.success("Idea saved successfully!");
      
      // Reload the page to show overview
      window.location.reload();
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save idea. Please try again.");
    }
  };

  // Parse AI review into structured sections
  interface ReviewSection {
    title: string;
    content: string;
    subsections?: ReviewSection[];
  }

  interface ParsedReview {
    title: string;
    overallAssessment: string;
    whatINoticed: ReviewSection | null;
    strengths: string | null;
    criticalAreas: string | null;
    recommendations: string | null;
    nextSteps: string | null;
    finalAssessment: string | null;
    fullText: string;
  }

  const parseReviewSections = (review: string): ParsedReview => {
    // Extract title from "AI Review: ..." header (handles **AI Review: ...** or ## AI Review: ...)
    const titleMatchBold = review.match(/\*\*AI Review:\s*([^*]+)\*\*/i);
    const titleMatchHeader = review.match(/##\s*AI Review:\s*([^\n]+)/i);
    const title = titleMatchBold ? titleMatchBold[1].trim() : (titleMatchHeader ? titleMatchHeader[1].trim() : 'Your Idea');

    // Extract Overall Assessment (handles ## Overall Assessment or **Overall Assessment**)
    const overallMatch = review.match(/(?:##|\*\*)\s*Overall Assessment[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:What|Strengths|Critical|Recommendations|Next|Final|$)|$)/i);
    const overallAssessment = overallMatch ? overallMatch[1].trim() : '';

    // Extract What I Noticed section (may have subsections)
    const noticedMatch = review.match(/(?:##|\*\*)\s*What I Noticed[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:Strengths|Critical|Recommendations|Next Steps|Final|$)|$)/i);
    let whatINoticed: ReviewSection | null = null;
    if (noticedMatch) {
      const noticedContent = noticedMatch[1].trim();
      const subsections: ReviewSection[] = [];
      
      // Extract subsections like "Target Audience", "Problem Indicators", etc.
      // Split by bold markers and extract pairs
      const lines = noticedContent.split('\n');
      let currentSubsection: { title: string; content: string[] } | null = null;
      
      for (const line of lines) {
        const boldMatch = line.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          // Save previous subsection if exists
          if (currentSubsection) {
            subsections.push({
              title: currentSubsection.title,
              content: currentSubsection.content.join('\n').trim()
            });
          }
          // Start new subsection
          const title = boldMatch[1].trim();
          const afterTitle = line.substring(boldMatch.index! + boldMatch[0].length).trim();
          currentSubsection = {
            title: title,
            content: afterTitle ? [afterTitle] : []
          };
        } else if (currentSubsection && line.trim()) {
          // Add line to current subsection
          currentSubsection.content.push(line);
        }
      }
      
      // Add last subsection
      if (currentSubsection) {
        subsections.push({
          title: currentSubsection.title,
          content: currentSubsection.content.join('\n').trim()
        });
      }

      whatINoticed = {
        title: 'What I Noticed in Your Description',
        content: noticedContent,
        subsections: subsections.length > 0 ? subsections : undefined
      };
    }

    // Extract Strengths (handles variations like "Strengths I've Identified", "Strengths Identified")
    const strengthsMatch = review.match(/(?:##|\*\*)\s*Strengths[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:Critical|Recommendations|Next|Final|$)|$)/i);
    const strengths = strengthsMatch ? strengthsMatch[1].trim() : null;

    // Extract Critical Areas (handles variations)
    const criticalMatch = review.match(/(?:##|\*\*)\s*Critical Areas[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:Recommendations|Next|Final|$)|$)/i);
    const criticalAreas = criticalMatch ? criticalMatch[1].trim() : null;

    // Extract Recommendations
    const recommendationsMatch = review.match(/(?:##|\*\*)\s*Recommendations[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:Next|Final|$)|$)/i);
    const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : null;

    // Extract Next Steps (handles variations like "Next Steps Prioritized")
    const nextStepsMatch = review.match(/(?:##|\*\*)\s*Next Steps[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)\s*(?:Final|$)|$)/i);
    const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim() : null;

    // Extract Final Assessment
    const finalMatch = review.match(/(?:##|\*\*)\s*Final Assessment[\s\S]*?\n\n([\s\S]*?)(?=\n(?:##|\*\*)|$)/i);
    const finalAssessment = finalMatch ? finalMatch[1].trim() : null;

    return {
      title,
      overallAssessment,
      whatINoticed,
      strengths,
      criticalAreas,
      recommendations,
      nextSteps,
      finalAssessment,
      fullText: review
    };
  };

  // Strip markdown syntax from text for clean display
  const stripMarkdown = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove headers (##, ###, etc.)
      .replace(/^#+\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_)
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
      // Remove code blocks ```
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove list markers (-, *, +, 1.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Smart truncation that respects section boundaries
  const smartTruncate = (text: string, maxLength: number = 500): { truncated: string; isComplete: boolean } => {
    if (text.length <= maxLength) {
      return { truncated: text, isComplete: true };
    }

    // Try to truncate at a section boundary (## header)
    const beforeMax = text.substring(0, maxLength);
    const lastSectionMatch = beforeMax.match(/##\s+[^\n]+/g);
    
    if (lastSectionMatch && lastSectionMatch.length > 0) {
      // Find the last complete section
      const lastSection = lastSectionMatch[lastSectionMatch.length - 1];
      const lastSectionIndex = beforeMax.lastIndexOf(lastSection);
      
      // Find the end of this section (next ## or end of text)
      const afterSection = text.substring(lastSectionIndex);
      const nextSectionMatch = afterSection.match(/\n##\s+[^\n]+/);
      
      if (nextSectionMatch) {
        const sectionEnd = lastSectionIndex + nextSectionMatch.index!;
        return {
          truncated: text.substring(0, sectionEnd).trim() + '...',
          isComplete: false
        };
      }
    }

    // Fallback: truncate at paragraph boundary
    const lastParagraphEnd = beforeMax.lastIndexOf('\n\n');
    if (lastParagraphEnd > maxLength * 0.7) {
      return {
        truncated: text.substring(0, lastParagraphEnd).trim() + '...',
        isComplete: false
      };
    }

    // Last resort: truncate at sentence boundary
    const lastSentenceEnd = Math.max(
      beforeMax.lastIndexOf('. '),
      beforeMax.lastIndexOf('.\n'),
      beforeMax.lastIndexOf('! '),
      beforeMax.lastIndexOf('?\n')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return {
        truncated: text.substring(0, lastSentenceEnd + 1) + '...',
        isComplete: false
      };
    }

    return {
      truncated: beforeMax.trim() + '...',
      isComplete: false
    };
  };

  // Extract idea title and description from AI review (improved)
  const extractIdeaFromReview = (review: string, userInput?: string | null, selectedIdea?: { title?: string; description?: string } | null) => {
    // Priority 1: Use selected idea (for "surprise-me" mode)
    if (selectedIdea?.title) {
      return {
        title: stripMarkdown(selectedIdea.title),
        description: selectedIdea.description 
          ? stripMarkdown(selectedIdea.description.substring(0, 300)) + (selectedIdea.description.length > 300 ? '...' : '')
          : 'No description provided.'
      };
    }

    // Priority 2: Use user's original input if available
    if (userInput && userInput.trim()) {
      const cleanInput = stripMarkdown(userInput.trim());
      // Use first sentence or first 80 chars as title
      const firstSentence = cleanInput.split(/[.!?]/).find(s => s.trim().length > 10) || cleanInput;
      const title = firstSentence.trim().substring(0, 80);
      const description = cleanInput.substring(0, 300) + (cleanInput.length > 300 ? '...' : '');
      
      return {
        title: title || 'Your Idea',
        description: description || 'No description provided.'
      };
    }

    const parsed = parseReviewSections(review);
    
    // Priority 3: Extract from Overall Assessment (clean, no markdown)
    if (parsed.overallAssessment) {
      let content = stripMarkdown(parsed.overallAssessment);
      
      // Try to find quoted text (user's input) - extract it clean
      const quoteMatch = content.match(/[""]([^""]+)[""]/);
      if (quoteMatch) {
        const quoted = quoteMatch[1].trim();
        return {
          title: stripMarkdown(quoted.substring(0, 80).split('.')[0] || 'Your Idea'),
          description: stripMarkdown(quoted.substring(0, 300)) + (quoted.length > 300 ? '...' : '')
        };
      }
      
      // Use first meaningful sentence from Overall Assessment
      const firstSentence = content.split(/[.!?]/).find(s => s.trim().length > 20);
      if (firstSentence) {
        const cleanTitle = stripMarkdown(firstSentence.trim().substring(0, 80));
        const cleanDescription = stripMarkdown(content.substring(0, 300));
        return {
          title: cleanTitle || 'Your Idea',
          description: cleanDescription + (content.length > 300 ? '...' : '')
        };
      }
      
      // Use first paragraph from Overall Assessment
      const firstParagraph = content.split('\n\n').find(p => p.trim().length > 30) || content;
      const cleanDesc = stripMarkdown(firstParagraph.trim().substring(0, 300));
      return {
        title: stripMarkdown(parsed.title && parsed.title !== 'Your Idea' ? parsed.title : 'Your Idea'),
        description: cleanDesc + (cleanDesc.length >= 300 ? '...' : '')
      };
    }

    // Priority 4: Extract from AI Review title header
    if (parsed.title && parsed.title !== 'Your Idea') {
      const cleanTitle = stripMarkdown(parsed.title);
      // Use first line of review as description (avoiding "What I Noticed")
      const lines = review.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 10 && 
               !trimmed.startsWith('##') && 
               !trimmed.includes('What I Noticed') &&
               !trimmed.startsWith('**');
      });
      const firstCleanLine = lines[0] ? stripMarkdown(lines[0].trim().substring(0, 300)) : '';
      
      return {
        title: cleanTitle,
        description: firstCleanLine + (firstCleanLine.length >= 300 ? '...' : '') || 'No description available.'
      };
    }

    // Fallback: use first clean line from review (avoiding markdown headers)
    const firstLine = review.split('\n').find(line => {
      const trimmed = line.trim();
      return trimmed.length > 10 && 
             !trimmed.startsWith('##') && 
             !trimmed.includes('What I Noticed') &&
             !trimmed.startsWith('**AI Review');
    });
    
    if (firstLine) {
      const cleanTitle = stripMarkdown(firstLine.trim().substring(0, 80));
      const cleanDesc = stripMarkdown(review.substring(0, 300));
      return {
        title: cleanTitle || 'Your Saved Idea',
        description: cleanDesc + (review.length > 300 ? '...' : '')
      };
    }

    // Ultimate fallback
    return {
      title: 'Your Saved Idea',
      description: stripMarkdown(review.substring(0, 300)) + (review.length > 300 ? '...' : '')
    };
  };

  const getSavedIdeaText = (inputData: any) => {
    if (!inputData) return "";
    if (inputData.mode === "surprise-me") {
      if (typeof inputData.selectedIdea === "string") {
        return inputData.selectedIdea;
      }
      if (inputData.selectedIdea?.description) {
        return inputData.selectedIdea.description;
      }
      if (inputData.selectedIdea?.title) {
        return `${inputData.selectedIdea.title}\n\n${inputData.selectedIdea.description || ""}`.trim();
      }
    }
    return inputData.userInput || "";
  };

  const getCurrentAiProductOverview = () => {
    if (aiReview?.trim()) {
      return aiReview.trim();
    }
    if (typeof savedData?.output === "object" && savedData?.output !== null) {
      const overview = (savedData.output as any).aiReview;
      if (typeof overview === "string" && overview.trim()) {
        return overview.trim();
      }
    } else if (typeof savedData?.output === "string" && savedData.output.trim()) {
      return savedData.output.trim();
    }
    return "";
  };

  const buildHistoryEntry = (inputSnapshot: any, outputSnapshot: any): IdeaHistoryEntry => {
    const ideaText = getSavedIdeaText(inputSnapshot);
    const aiReviewText =
      typeof outputSnapshot === "object" && outputSnapshot !== null
        ? outputSnapshot.aiReview ?? ""
        : String(outputSnapshot ?? "");
    const ideaInfo = extractIdeaFromReview(
      aiReviewText,
      inputSnapshot.userInput || null,
      inputSnapshot.selectedIdea || null,
    );
    return {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `version-${Date.now()}`,
      savedAt: new Date().toISOString(),
      title: ideaInfo.title,
      summary: ideaInfo.description,
      content: ideaText,
      targetMarket: inputSnapshot.targetMarket || null,
      targetCountry: inputSnapshot.targetCountry || null,
      budget: inputSnapshot.budget || null,
      timescales: inputSnapshot.timescales || null,
      validation:
        typeof outputSnapshot === "object" && outputSnapshot !== null
          ? outputSnapshot.initialFeedback ?? null
          : null,
    };
  };

  const handleEditIdea = () => {
    if (!savedData) return;
    const inputData = savedData.input || {};
    const existingFeedback =
      typeof savedData.output === "object" && savedData.output !== null
        ? (savedData.output as any).initialFeedback ?? null
        : null;
    const ideaNarrative = getSavedIdeaText(inputData);
    const existingOverview = getCurrentAiProductOverview();

    setEditForm({
      ideaText: ideaNarrative,
      targetMarket: inputData.targetMarket || "",
      targetCountry: inputData.targetCountry || "",
      budget: inputData.budget || "",
      timescales: inputData.timescales || "",
    });
    setRefinementSuggestions(null);
    setSuggestionError(null);
    setDraftValidation(existingFeedback);
    setValidationDeltas({});
    setIsEditingExisting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (ideaNarrative && existingFeedback) {
      void loadPillarSuggestions(ideaNarrative, existingFeedback, existingOverview);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingExisting(false);
    setRefinementSuggestions(null);
    setSuggestionError(null);
    setDraftValidation(null);
    setValidationDeltas({});
    setSuggestionsLoading(false);
    setIsRevalidating(false);
  };

  const cloneInputSnapshot = () => {
    if (!savedData?.input) {
      return {};
    }
    try {
      return JSON.parse(JSON.stringify(savedData.input));
    } catch {
      return { ...(savedData.input as any) };
    }
  };

  const buildDraftInputSnapshot = (ideaText: string) => {
    if (!savedData) {
      return null;
    }
    const clonedInput = cloneInputSnapshot();
    clonedInput.targetMarket = editForm.targetMarket || null;
    clonedInput.targetCountry = editForm.targetCountry || null;
    clonedInput.budget = editForm.budget || null;
    clonedInput.timescales = editForm.timescales || null;

    if (clonedInput.mode === "surprise-me") {
      let normalizedSelected = clonedInput.selectedIdea;
      if (!normalizedSelected || typeof normalizedSelected === "string") {
        normalizedSelected = {
          title:
            typeof normalizedSelected === "string"
              ? normalizedSelected || "Improved Idea"
              : clonedInput.selectedIdea?.title || "Improved Idea",
          description: ideaText,
        };
      } else {
        normalizedSelected = {
          ...normalizedSelected,
          description: ideaText,
        };
        if (!normalizedSelected.title) {
          normalizedSelected.title = "Improved Idea";
        }
      }
      clonedInput.selectedIdea = normalizedSelected;
    } else {
      clonedInput.userInput = ideaText;
    }

    return clonedInput;
  };

  const tokenizeRationale = (text?: string | null) => {
    if (!text) return [];
    return text
      .split(/[\n\.]/)
      .map((entry) => entry.replace(/^[\-\*\•]\s*/, "").trim())
      .filter((entry) => entry.length > 0)
      .slice(0, 3);
  };

  const getScoreBadgeClasses = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 55) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 55) return "bg-yellow-500";
    return "bg-red-500";
  };


  const computeScoreDeltas = (
    previous: InitialFeedbackData | null,
    next: InitialFeedbackData,
  ): Record<string, ScoreDelta> => {
    const deltas: Record<string, ScoreDelta> = {};
    if (!next?.scores) return deltas;
    for (const [key, data] of Object.entries(next.scores)) {
      const currentScore =
        typeof (data as any)?.score === "number" ? (data as any).score : 0;
      const previousScore =
        typeof previous?.scores?.[key as keyof InitialFeedbackData["scores"]]?.score === "number"
          ? previous!.scores[key as keyof InitialFeedbackData["scores"]].score
          : null;
      deltas[key] = {
        from: previousScore,
        to: currentScore,
        change: typeof previousScore === "number" ? currentScore - previousScore : null,
      };
    }
    if (typeof next.overallConfidence === "number") {
      const prevConfidence =
        typeof previous?.overallConfidence === "number"
          ? previous.overallConfidence
          : null;
      deltas.overallConfidence = {
        from: prevConfidence,
        to: next.overallConfidence,
        change:
          typeof prevConfidence === "number"
            ? next.overallConfidence - prevConfidence
            : null,
      };
    }
    return deltas;
  };

  const handleApplyImprovement = async (entry: ImprovementLogEntry) => {
    if (!entry.improvedOverview) {
      toast.error("Improvement snapshot is unavailable.");
      return;
    }
    setRefinedOverview((prev) => {
      if (prev) {
        setOverviewHistory((history) => [...history, prev]);
      }
      return entry.improvedOverview || prev;
    });
    
    // Update AI review with the serialized refined overview
    const updatedReview = serializeOverview(entry.improvedOverview);
    setAiReview(updatedReview);
    
    // Update saved data with the new AI review
    setSavedData((prev) => {
      if (!prev) return prev;
      const nextOutput =
        typeof prev.output === "object" && prev.output !== null ? { ...prev.output } : {};
      nextOutput.aiReview = updatedReview;
      nextOutput.refinedOverview = entry.improvedOverview;
      return { ...prev, output: nextOutput };
    });
    
    // Save to database
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: "ideate",
            output: JSON.stringify({
              ...(typeof savedData?.output === "object" && savedData.output ? savedData.output : {}),
              aiReview: updatedReview,
              refinedOverview: entry.improvedOverview,
            }),
          }),
        });
      } catch (error) {
        console.error("Failed to save updated AI review:", error);
        // Don't show error to user - the state is updated locally
      }
    }
    
    toast.success(`Applied improvement for ${entry.pillar}`);
  };

  const undoLastImprovement = () => {
    setOverviewHistory((history) => {
      if (!history.length) return history;
      const clone = [...history];
      const previous = clone.pop();
      if (previous) {
        setRefinedOverview(previous);
        toast.message("Reverted last improvement");
      }
      return clone;
    });
  };

  const handleRefinePillar = async (pillarKey: string, selectedDirectionId?: string) => {
    if (!projectId) return;
    const applyingDirection = typeof selectedDirectionId === "string" && selectedDirectionId.length > 0;
    if (applyingDirection) {
      // Use compound key to track specific direction/action: "pillarKey:directionId" or "pillarKey:auto"
      setRefineLoadingPillar(`${pillarKey}:${selectedDirectionId}`);
    } else {
      setDirectionLoadingPillar(pillarKey);
    }
    try {
      const response = await fetch("/api/ideate/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          targetPillar: pillarKey,
          ...(applyingDirection ? { selectedDirectionId } : {}),
        }),
      });

      if (!response.ok) {
        let errorMessage: string = "Failed to refine idea";
        try {
          const text = await response.text();
          if (text && typeof text === "string" && text.trim()) {
            try {
              const parsed = JSON.parse(text);
              if (parsed && typeof parsed === "object" && "error" in parsed) {
                const errorValue = (parsed as { error?: string }).error;
                if (typeof errorValue === "string" && errorValue.trim()) {
                  errorMessage = errorValue.trim();
                }
              }
            } catch {
              const trimmed = text.trim();
              if (trimmed.length > 0 && trimmed.length < 200) {
                errorMessage = trimmed;
              }
            }
          }
        } catch {
          // Ignore parse errors and use fallback
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!applyingDirection && data?.status === "directions") {
        const directions = Array.isArray(data.improvementDirections) ? data.improvementDirections : [];
        if (!directions.length) {
          throw new Error("AI did not return any improvement directions. Please try again.");
        }
        const pendingPayload = {
          targetPillar: data.targetPillar || pillarKey,
          generatedAt: data.generatedAt || new Date().toISOString(),
          directions,
        };
        setPillarDirections({
          [pillarKey]: {
            directions: pendingPayload.directions,
            generatedAt: pendingPayload.generatedAt,
          },
        });
        setPillarDirectionErrors({});
        setSavedData((prev) => {
          if (!prev) return prev;
          const nextOutput =
            typeof prev.output === "object" && prev.output !== null ? { ...prev.output } : {};
          nextOutput.pendingImprovementDirections = pendingPayload;
          return { ...prev, output: nextOutput };
        });
        toast.success(
          `Found ${directions.length} improvement direction${directions.length === 1 ? "" : "s"}. Choose one to continue.`,
        );
        return;
      }

      const improvedOverview = data.improvedOverview as ProductOverview | undefined;
      if (!improvedOverview) {
        throw new Error("AI response did not include an improved overview. Please try again.");
      }

      const updatedDifferences = Array.isArray(data.differences) ? data.differences : [];
      const updatedFeedback = data.updatedFeedback as InitialFeedbackData | undefined;
      const previousFeedback =
        typeof savedData?.output === "object" && savedData.output
          ? ((savedData.output as { initialFeedback?: InitialFeedbackData }).initialFeedback ?? null)
          : null;

      setRefinedOverview(improvedOverview);
      if (updatedFeedback) {
        const deltas = computeScoreDeltas(previousFeedback, updatedFeedback);
        setFeedbackDeltas(deltas);
        setPreviousFeedback(previousFeedback);

        const overallDelta = deltas.overallConfidence?.change;
        if (typeof overallDelta === "number" && overallDelta < 0) {
          toast.warning(
            `Overall confidence decreased by ${Math.abs(overallDelta)} points. The target pillar improved, but other aspects were re-evaluated.`,
            { duration: 6000 },
          );
        } else if (typeof overallDelta === "number" && overallDelta > 0) {
          toast.success(`Overall confidence increased by ${overallDelta} points!`);
        }

        const targetPillarDelta = deltas[data.pillarImpacted || pillarKey]?.change;
        if (typeof targetPillarDelta === "number" && targetPillarDelta > 0) {
          const decreasedPillars = Object.entries(deltas).filter(
            ([key, delta]) =>
              key !== "overallConfidence" &&
              key !== data.pillarImpacted &&
              typeof delta?.change === "number" &&
              delta.change < 0,
          );
          if (decreasedPillars.length > 0) {
            const pillarNames = decreasedPillars.map(([key]) => PILLAR_KEY_TO_LABEL[key] || key).join(", ");
            toast.info(
              `Target pillar improved by ${targetPillarDelta} points, but ${pillarNames} ${
                decreasedPillars.length === 1 ? "decreased" : "decreased"
              }.`,
              { duration: 5000 },
            );
          }
        }
      }

      const iterationPayload = {
        pillarImpacted: data.pillarImpacted || pillarKey,
        scoreDelta: typeof data.scoreDelta === "number" ? data.scoreDelta : null,
        differences: updatedDifferences,
        beforeSection: data.beforeSection ?? updatedDifferences[0]?.before,
        afterSection: data.afterSection ?? updatedDifferences[0]?.after,
        improvedOverview,
        createdAt: new Date().toISOString(),
        source: "manual",
      };

      setSavedData((prev) => {
        if (!prev) return prev;
        const nextOutput =
          typeof prev.output === "object" && prev.output !== null ? { ...prev.output } : {};
        nextOutput.refinedOverview = improvedOverview;
        if (updatedFeedback) {
          nextOutput.initialFeedback = updatedFeedback;
          nextOutput.pillarScores = updatedFeedback.scores;
        }
        nextOutput.latestDifferences = updatedDifferences;
        nextOutput.improvementIterations = [
          ...(Array.isArray(nextOutput.improvementIterations) ? nextOutput.improvementIterations : []),
          iterationPayload,
        ];
        nextOutput.pendingImprovementDirections = null;
        return { ...prev, output: nextOutput };
      });

      const newEntry: ImprovementLogEntry = {
        id: iterationPayload.createdAt,
        pillar: iterationPayload.pillarImpacted,
        scoreDelta: iterationPayload.scoreDelta,
        differences: updatedDifferences,
        beforeSection: iterationPayload.beforeSection,
        afterSection: iterationPayload.afterSection,
        improvedOverview,
        createdAt: iterationPayload.createdAt,
        source: "manual",
      };
      setImprovementLog((prev) => [newEntry, ...prev]);
      await loadImprovementHistory();
      const deltaLabel =
        typeof iterationPayload.scoreDelta === "number" && iterationPayload.scoreDelta !== 0
          ? ` (${iterationPayload.scoreDelta > 0 ? "+" : ""}${iterationPayload.scoreDelta})`
          : "";

      const overallDelta =
        typeof updatedFeedback?.overallConfidence === "number" && previousFeedback
          ? updatedFeedback.overallConfidence - (previousFeedback.overallConfidence ?? 0)
          : null;

      if (typeof overallDelta === "number" && overallDelta < 0) {
        toast.success(
          `Target pillar ${data.pillarImpacted || pillarKey} improved${deltaLabel}, but overall confidence decreased by ${Math.abs(overallDelta)} points.`,
          { duration: 6000 },
        );
      } else {
        toast.success(`Improved ${data.pillarImpacted || pillarKey}${deltaLabel}`);
      }

      setPillarDirections({});
      setPillarDirectionErrors({});
    } catch (error) {
      console.error("Refine pillar error:", error);
      let errorMsg = "Failed to refine idea";
      try {
        if (error instanceof Error) {
          errorMsg = error.message || errorMsg;
        } else if (typeof error === "string") {
          errorMsg = error;
        } else if (error && typeof error === "object") {
          const msg = (error as { message?: string })?.message;
          if (typeof msg === "string" && msg.trim()) {
            errorMsg = msg.trim();
          }
        }
      } catch {
        // Ignore secondary errors
      }
      toast.error(errorMsg);
      if (!applyingDirection) {
        setPillarDirectionErrors((prev) => ({ ...prev, [pillarKey]: errorMsg }));
      }
    } finally {
      if (applyingDirection) {
        setRefineLoadingPillar(null);
      } else {
        setDirectionLoadingPillar(null);
      }
    }
  };

  const handleAutoImprove = async (targetScore = 95) => {
    if (!projectId) return;
    setAutoImproving(true);
    try {
      const response = await fetch("/api/ideate/auto-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, targetScore }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to auto-improve idea");
      }

      const data = await response.json();
      const finalOverview = data?.finalOverview as ProductOverview | undefined;
      if (finalOverview) {
        setRefinedOverview(finalOverview);
      }

      const previousFeedback =
        typeof savedData?.output === "object" && savedData.output
          ? ((savedData.output as { initialFeedback?: InitialFeedbackData }).initialFeedback ?? null)
          : null;

      if (data?.finalFeedback) {
        setFeedbackDeltas(computeScoreDeltas(previousFeedback, data.finalFeedback as InitialFeedbackData));
        setPreviousFeedback(previousFeedback);
      }

      if (Array.isArray(data?.iterations)) {
        const entries = (data.iterations as any[]).map((item: any, index: number) => {
          const differences = Array.isArray(item?.differences) ? item.differences : [];
          return {
            id: item?.id ?? `auto-${Date.now()}-${index}`,
            pillar: item?.pillarImpacted || `iteration-${index}`,
            scoreDelta: typeof item?.scoreDelta === "number" ? item.scoreDelta : null,
            differences,
            beforeSection: item?.beforeSection ?? differences[0]?.before,
            afterSection: item?.afterSection ?? differences[0]?.after,
            improvedOverview: (item?.improvedOverview || data?.finalOverview) as ProductOverview,
            createdAt: item?.createdAt || new Date().toISOString(),
            source: "auto",
          } as ImprovementLogEntry;
        });
        setImprovementLog((prev) => [...entries, ...prev]);
      }

      setSavedData((prev) => {
        if (!prev) return prev;
        const nextOutput =
          typeof prev.output === "object" && prev.output !== null ? { ...prev.output } : {};
        if (finalOverview) {
          nextOutput.refinedOverview = finalOverview;
        }
        if (data?.finalFeedback) {
          nextOutput.initialFeedback = data.finalFeedback;
          nextOutput.pillarScores = data.finalFeedback.scores;
        }
        const latestIteration =
          Array.isArray(data?.iterations) && data.iterations.length
            ? data.iterations[data.iterations.length - 1]
            : null;
        nextOutput.latestDifferences = latestIteration?.differences ?? [];
        nextOutput.improvementIterations = [
          ...(Array.isArray(nextOutput.improvementIterations) ? nextOutput.improvementIterations : []),
          ...(Array.isArray(data?.iterations) ? data.iterations : []),
        ];
        return { ...prev, output: nextOutput };
      });

      await loadImprovementHistory();
      toast.success(data?.reachedTarget ? "Idea auto-improved to target" : "Auto-improve completed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to auto-improve idea");
    } finally {
      setAutoImproving(false);
    }
  };

  const loadPillarSuggestions = async (
    ideaText: string,
    feedback: InitialFeedbackData | null,
    aiProductOverviewText?: string | null,
  ) => {
    if (!ideaText?.trim() || !feedback?.scores) {
      setRefinementSuggestions(null);
      return;
    }

    const overviewCandidate =
      typeof aiProductOverviewText === "string" && aiProductOverviewText.trim().length
        ? aiProductOverviewText
        : getCurrentAiProductOverview();
    const normalizedOverview = overviewCandidate?.trim() || "";
    if (!normalizedOverview) {
      setSuggestionError("AI Product Overview is missing. Re-run initial assessment to regenerate it.");
      setRefinementSuggestions(null);
      return;
    }

    const pillars = Object.entries(feedback.scores).map(([key, value]) => ({
      key,
      label: PILLAR_KEY_TO_LABEL[key] || key,
      score: typeof value?.score === "number" ? value.score : null,
      rationale: value?.rationale || "",
    }));

    const weakPillars = pillars.filter(
      (pillar) => typeof pillar.score === "number" && pillar.score < 75,
    );

    if (!weakPillars.length) {
      setSuggestionError(null);
      setRefinementSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    setSuggestionError(null);

    try {
      const response = await fetch("/api/ai/ideate/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: ideaText,
          aiProductOverview: normalizedOverview,
          pillarWeaknesses: weakPillars.map((pillar) => ({
            pillar: pillar.label,
            score: pillar.score ?? 0,
            rationale: pillar.rationale,
            weaknesses: tokenizeRationale(pillar.rationale),
          })),
          pillarScores: feedback.scores ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to load AI suggestions");
      }

      const data = await response.json();
      const suggestionsArray: any[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
      const mapped = suggestionsArray.map((item: any, index: number) => {
        const normalizedLabel = typeof item?.pillar === "string" ? item.pillar : "Unknown";
        const labelKey = normalizedLabel.toLowerCase();
        const pillarKey = PILLAR_LABEL_TO_KEY[labelKey] || labelKey;
        const targetPillar = pillars.find(
          (pillar) => pillar.label.toLowerCase() === normalizedLabel.toLowerCase(),
        );
        return {
          id: `${pillarKey}-${index}`,
          pillar: normalizedLabel,
          pillarKey,
          score: targetPillar?.score ?? null,
          issue: item?.issue || "",
          rationale: item?.rationale || "",
          suggestion: item?.suggestion || "",
          estimatedImpact:
            typeof item?.estimatedImpact === "number"
              ? Math.max(1, Math.round(item.estimatedImpact))
              : typeof targetPillar?.score === "number"
              ? Math.max(1, 85 - (targetPillar?.score ?? 0))
              : 5,
        } as RefinementSuggestion;
      });

      setRefinementSuggestions(mapped);
    } catch (error) {
      console.error("Suggestion fetch error:", error);
      setSuggestionError(
        error instanceof Error ? error.message : "Failed to fetch AI suggestions",
      );
      setRefinementSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const revalidateDraftIdea = async (
    ideaText: string,
    options?: RevalidateOptions,
  ): Promise<RevalidateResult | null> => {
    if (!ideaText.trim()) {
      toast.error("Please describe your idea before running initial assessment.");
      return null;
    }
    const draftInput = buildDraftInputSnapshot(ideaText);
    if (!draftInput) {
      toast.error("Unable to prepare idea data for initial assessment.");
      return null;
    }

    setIsRevalidating(true);
    try {
      const payload = buildReviewPayload(draftInput);
      const overrideText = options?.aiProductOverviewOverride?.trim();

      if (overrideText) {
        const feedbackResponse = await fetch("/api/ai/ideate/initial-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, aiReview: overrideText }),
        });

        if (!feedbackResponse.ok) {
          const errorData = await feedbackResponse.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to refresh initial assessment");
        }

        const feedbackData = await feedbackResponse.json();
        setDraftValidation((prev) => {
          setValidationDeltas(computeScoreDeltas(prev, feedbackData));
          return feedbackData;
        });
        setAiReview(overrideText);
        return { feedbackData, aiProductOverview: overrideText };
      }

      const { reviewText, feedbackData } = await regenerateReviewAndFeedback(draftInput);
      const normalizedReview = reviewText || "";
      setDraftValidation((prev) => {
        setValidationDeltas(computeScoreDeltas(prev, feedbackData));
        return feedbackData;
      });
      setAiReview(normalizedReview);
      return { feedbackData, aiProductOverview: normalizedReview };
    } catch (error) {
      console.error("Draft validation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run initial assessment");
      return null;
    } finally {
      setIsRevalidating(false);
    }
  };

  const buildReviewPayload = (input: any) => ({
    mode: input.mode,
    userInput: input.mode === "surprise-me" ? null : input.userInput,
    selectedIdea: input.mode === "surprise-me" ? input.selectedIdea : null,
    targetMarket: input.targetMarket || null,
    targetCountry: input.targetCountry || null,
    budget: input.budget || null,
    timescales: input.timescales || null,
  });

  const regenerateReviewAndFeedback = async (input: any) => {
    const payload = buildReviewPayload(input);

    const reviewResponse = await fetch("/api/ai/ideate/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!reviewResponse.ok) {
      const errorData = await reviewResponse.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to generate updated AI review");
    }

    const reviewData = await reviewResponse.json();
    const reviewText = reviewData.result || "";

    const feedbackResponse = await fetch("/api/ai/ideate/initial-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, aiReview: reviewText }),
    });

    if (!feedbackResponse.ok) {
      const errorData = await feedbackResponse.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to refresh initial assessment");
    }

    const feedbackData = await feedbackResponse.json();
    return { reviewText, feedbackData };
  };

  const handleImproveExistingIdea = async () => {
    if (!editForm.ideaText.trim()) {
      toast.error("Please provide your idea details before requesting improvements.");
      return;
    }

    const existingFeedback =
      typeof savedData?.output === "object" && savedData?.output
        ? savedData.output.initialFeedback ?? null
        : null;

    setIsImprovingIdea(true);
    setRefinementSuggestions(null);
    setSuggestionError(null);

    try {
      const response = await fetch("/api/ai/ideate/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: editForm.ideaText,
          mode: savedData?.input?.mode ?? null,
          targetMarket: editForm.targetMarket || null,
          targetCountry: editForm.targetCountry || null,
          budget: editForm.budget || null,
          timescales: editForm.timescales || null,
          initialFeedback: existingFeedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to refine idea");
      }

      const data = await response.json();
      let updatedIdeaText = editForm.ideaText;
      if (typeof data.idea === "string") {
        updatedIdeaText = data.idea.trim();
        setEditForm((prev) => ({ ...prev, ideaText: updatedIdeaText }));
      }
      toast.success("Idea refreshed — running initial assessment...");
      const revalidationResult = await revalidateDraftIdea(updatedIdeaText);
      if (revalidationResult) {
        const { feedbackData, aiProductOverview: latestOverview } = revalidationResult;
        await loadPillarSuggestions(updatedIdeaText, feedbackData, latestOverview);
      }
    } catch (error) {
      console.error("Refine idea error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to refine idea");
    } finally {
      setIsImprovingIdea(false);
    }
  };

  const handleApplySuggestion = async (suggestion: RefinementSuggestion) => {
    if (!editForm.ideaText.trim()) {
      toast.error("Please enter your idea before applying suggestions.");
      return;
    }

    const existingFeedback =
      typeof savedData?.output === "object" && savedData?.output
        ? savedData.output.initialFeedback ?? null
        : null;

    const currentOverview = getCurrentAiProductOverview();
    if (!currentOverview) {
      toast.error("AI Product Overview is missing. Re-run initial assessment before applying suggestions.");
      return;
    }

    setApplyingSuggestionId(suggestion.id);
    try {
      const response = await fetch("/api/ai/ideate/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: editForm.ideaText,
          mode: savedData?.input?.mode ?? null,
          targetMarket: editForm.targetMarket || null,
          targetCountry: editForm.targetCountry || null,
          budget: editForm.budget || null,
          timescales: editForm.timescales || null,
          initialFeedback: existingFeedback,
          forcedSuggestion: suggestion.suggestion,
          forcedPillar: suggestion.pillar,
          issue: suggestion.issue,
          rationale: suggestion.rationale,
          aiProductOverview: currentOverview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to apply suggestion");
      }

      const data = await response.json();
      let updatedIdeaText = editForm.ideaText;
      if (typeof data.idea === "string" && data.idea.trim()) {
        updatedIdeaText = data.idea.trim();
        setEditForm((prev) => ({ ...prev, ideaText: updatedIdeaText }));
      }
      const updatedOverview =
        typeof data.aiProductOverview === "string" && data.aiProductOverview.trim()
          ? data.aiProductOverview.trim()
          : currentOverview;
      setAiReview(updatedOverview);
      setSavedData((prev) => {
        if (!prev) return prev;
        const nextOutput =
          typeof prev.output === "object" && prev.output !== null
            ? { ...prev.output, aiReview: updatedOverview }
            : { aiReview: updatedOverview, initialFeedback: (prev.output as any)?.initialFeedback ?? null };
        return { ...prev, output: nextOutput };
      });
      toast.success(`Applied ${suggestion.pillar} improvement — running initial assessment...`);
      const revalidationResult = await revalidateDraftIdea(updatedIdeaText, {
        aiProductOverviewOverride: updatedOverview,
      });
      if (revalidationResult) {
        const { feedbackData, aiProductOverview: latestOverview } = revalidationResult;
        // Update savedData with the latest overview to ensure component displays full text
        if (latestOverview) {
          setAiReview(latestOverview);
          setSavedData((prev) => {
            if (!prev) return prev;
            const nextOutput =
              typeof prev.output === "object" && prev.output !== null
                ? { ...prev.output, aiReview: latestOverview }
                : { aiReview: latestOverview, initialFeedback: (prev.output as any)?.initialFeedback ?? null };
            return { ...prev, output: nextOutput };
          });
        }
        await loadPillarSuggestions(updatedIdeaText, feedbackData, latestOverview);
      }
    } catch (error) {
      console.error("Apply suggestion error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply suggestion");
    } finally {
      setApplyingSuggestionId(null);
    }
  };

  const handleSaveEditedIdea = async () => {
    if (!savedData) return;
    if (!editForm.ideaText.trim()) {
      toast.error("Please update your idea before saving.");
      return;
    }

    setIsSavingEditedIdea(true);

    try {
      const originalInput = savedData.input || {};
      const updatedInput = {
        ...originalInput,
        targetMarket: editForm.targetMarket || null,
        targetCountry: editForm.targetCountry || null,
        budget: editForm.budget || null,
        timescales: editForm.timescales || null,
      };

      if (originalInput.mode === "surprise-me") {
        let normalizedSelected = originalInput.selectedIdea;
        if (!normalizedSelected || typeof normalizedSelected === "string") {
          normalizedSelected = {
            title: typeof normalizedSelected === "string" ? "Improved Idea" : originalInput.selectedIdea?.title || "Improved Idea",
            description: editForm.ideaText,
          };
        } else {
          normalizedSelected = { ...normalizedSelected, description: editForm.ideaText };
        }
        updatedInput.selectedIdea = normalizedSelected;
      } else {
        updatedInput.userInput = editForm.ideaText;
      }

      const existingHistory: IdeaHistoryEntry[] = Array.isArray(originalInput.ideaHistory)
        ? originalInput.ideaHistory
        : [];
      const currentSnapshot =
        savedData && savedData.output
          ? buildHistoryEntry(originalInput, savedData.output)
          : null;
      const updatedHistory = currentSnapshot
        ? [currentSnapshot, ...existingHistory]
        : existingHistory;
      updatedInput.ideaHistory = updatedHistory.slice(0, 5);

      const { reviewText, feedbackData } = await regenerateReviewAndFeedback(updatedInput);

      const saveResponse = await fetch(`/api/projects/${projectId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "ideate",
          input: JSON.stringify(updatedInput),
          output: JSON.stringify({
            aiReview: reviewText,
            initialFeedback: feedbackData,
          }),
          status: "completed",
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save updated idea");
      }

      toast.success("Idea updated and revalidated");
      setSavedData({
        input: updatedInput,
        output: { aiReview: reviewText, initialFeedback: feedbackData },
        status: "completed",
      });
      setAiReview(reviewText);
      setInitialFeedback(feedbackData);
      setIsEditingExisting(false);
      setRefinementSuggestions(null);
      setDraftValidation(null);
      setValidationDeltas({});
      setSuggestionError(null);
      setShowFullReview(false);
    } catch (error) {
      console.error("Save edited idea error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update idea");
    } finally {
      setIsSavingEditedIdea(false);
    }
  };

  const handleReset = async () => {
    // Confirm with user before deleting
    const confirmed = window.confirm(
      "Are you sure you want to reset the Ideate stage? This will permanently delete all your ideas, reviews, and feedback. This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/stages?stage=ideate`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset ideate stage');
      }

      toast.success("Ideate stage reset successfully!");
      
      // Clear all state
      setSavedData(null);
      setIsEditingExisting(false);
      setRefinementSuggestions(null);
      setCurrentStep(1);
      setSelectedMode(null);
      setUserInput("");
      setSelectedIdeaId(null);
      setTargetMarket("");
      setTargetCountry("");
      setBudget("");
      setTimescales("");
      setShowReview(false);
      setAiReview("");
      setShowFullReview(false);
      setGeneratedIdeas([]);
      setIdeasGenerated(false);
      setInitialFeedback(null);
      setIsLoadingInitialFeedback(false);
      setReviewError(null);
      setDraftValidation(null);
      setValidationDeltas({});
      setSuggestionError(null);
      setSuggestionsLoading(false);
      setIsRevalidating(false);
      
      // Reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting ideate stage:', error);
      toast.error(error instanceof Error ? error.message : "Failed to reset ideate stage. Please try again.");
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedMode !== null;
    if (currentStep === 2) {
      if (selectedMode === "surprise-me") {
        // For surprise-me, allow proceeding (ideas will be auto-generated on Next)
        return true;
      }
      return userInput.trim().length > 0;
    }
    if (currentStep === 3) {
      // For all modes, require an idea to be selected if ideas have been generated
      if (ideasGenerated && generatedIdeas.length > 0) {
        return selectedIdeaId !== null;
      }
      // If ideas are still generating, don't allow proceeding
      if (isGeneratingIdeas) {
        return false;
      }
      // If no ideas generated yet, allow proceeding (will generate on next)
      return true;
    }
    return false;
  };

  const progressPercentage = (currentStep / 3) * 100;

  // Show overview if saved data exists and we're not in the middle of editing
  if (isLoadingSavedData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (savedData && !showReview) {
    const inputData = savedData.input;
    // Handle both old format (string) and new format (JSON object)
    const outputIsJson = typeof savedData.output === 'object' && savedData.output !== null;
    
    // Use refined overview if available, otherwise fall back to aiReview
    let aiReviewText: string;
    if (outputIsJson) {
      const output = savedData.output as any;
      if (output.refinedOverview) {
        // Serialize the refined overview to match the format used when applying improvements
        aiReviewText = serializeOverview(output.refinedOverview);
      } else {
        aiReviewText = output.aiReview ?? '';
      }
    } else {
      aiReviewText = String(savedData.output ?? '');
    }
    
    const savedInitialFeedback = outputIsJson ? (savedData.output as any).initialFeedback : null;
    
    const ideaInfo = extractIdeaFromReview(
      aiReviewText, 
      inputData.userInput || null,
      inputData.selectedIdea || null
    );
    const parsedReview = parseReviewSections(aiReviewText);
    const { truncated: previewText, isComplete } = smartTruncate(aiReviewText, 600);
    const ideaHistory: IdeaHistoryEntry[] = Array.isArray(inputData.ideaHistory)
      ? inputData.ideaHistory
      : [];
    
    // Get mode display text
    const modeText = inputData.mode === 'explore-idea' ? 'Explore an Idea' : 
                     inputData.mode === 'solve-problem' ? 'Solve a Problem' : 
                     inputData.mode === 'surprise-me' ? 'Surprise Me' : null;

    if (isEditingExisting) {
      return (
        <div className="space-y-6">
          <Card className="border border-purple-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-neutral-900">
                AI Product Overview
              </CardTitle>
              <CardDescription className="text-sm text-neutral-600">
                This is how the AI currently describes your product. Apply the suggestions below or edit the source narrative to refresh this overview on the next assessment run.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiReviewText ? (
                <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold [&>strong]:text-neutral-900">
                  <ReactMarkdown>{aiReviewText}</ReactMarkdown>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
                  No AI review available yet. Complete the ideate flow or re-run initial assessment to generate the product overview.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border border-neutral-200 bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-neutral-900">
                  Source Narrative & Context
                </CardTitle>
                <CardDescription className="text-sm text-neutral-600">
                  Edit the underlying story that powers the AI review. Changes here will flow through when you apply suggestions or re-run initial assessment.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNarrativeEditor((prev) => !prev)}
              >
                {showNarrativeEditor ? "Hide narrative editor" : "Edit source narrative"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showNarrativeEditor && (
                <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  Need to change the raw copy? Click “Edit source narrative” above to update the text and context that the AI review is based on.
                </div>
              )}
              {showNarrativeEditor && (
                <>
                  <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                      How this works
                    </p>
                    <div className="grid gap-4 md:grid-cols-3 text-sm text-neutral-700">
                      <div>
                        <p className="font-semibold text-neutral-900">1. Capture the narrative</p>
                        <p>Describe the user, their pain, and the solution so AI understands what you are building.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">2. Add context</p>
                        <p>Market, region, budget, and timeline guide how the five validation pillars are scored.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">3. Fix weak pillars</p>
                        <p>Use the AI suggestions below to push every pillar toward 85%+ before saving.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Idea Narrative (Who + Problem + Solution)
                    </Label>
                    <Textarea
                      value={editForm.ideaText}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, ideaText: e.target.value }))}
                      className="min-h-[220px] text-sm text-neutral-900"
                      placeholder="e.g., Solo founders who struggle to plan launches (who/problem) get an AI copilot that converts their raw ideas into validated blueprints and suggested build steps (solution)."
                    />
                    <p className="text-xs text-neutral-500">
                      Call out the specific user, the painful moment they face today, and the differentiating outcome your product promises. The more concrete you are, the easier it is to raise pillar scores.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">Target Market</Label>
                      <Input
                        value={editForm.targetMarket}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, targetMarket: e.target.value }))}
                        placeholder="e.g., B2B SaaS for finance teams"
                      />
                      <p className="text-xs text-neutral-500">Helps Audience Fit & Market Demand understand who you’re serving.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">Target Country</Label>
                      <Input
                        value={editForm.targetCountry}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, targetCountry: e.target.value }))}
                        placeholder="e.g., United States"
                      />
                      <p className="text-xs text-neutral-500">Guides Market Demand and Pricing Potential with regional context.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">Budget</Label>
                      <Input
                        value={editForm.budget}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, budget: e.target.value }))}
                        placeholder="e.g., $5k-$10k"
                      />
                      <p className="text-xs text-neutral-500">Feeds Feasibility + Pricing Potential so AI can assess realism.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">Timeline</Label>
                      <Input
                        value={editForm.timescales}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, timescales: e.target.value }))}
                        placeholder="e.g., 3-4 months"
                      />
                      <p className="text-xs text-neutral-500">Informs Feasibility by showing how quickly you expect to build.</p>
                    </div>
                  </div>
                </>
              )}

              {draftValidation && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Initial Assessment snapshot</p>
                      <p className="text-xs text-neutral-500">
                        Track how each pillar responds to your edits. Aim for at least 85% per pillar to unlock
                        high confidence — weak pillars will receive targeted suggestions.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const revalidationResult = await revalidateDraftIdea(editForm.ideaText);
                        if (revalidationResult) {
                          const { feedbackData, aiProductOverview: latestOverview } = revalidationResult;
                          await loadPillarSuggestions(editForm.ideaText, feedbackData, latestOverview);
                        }
                      }}
                      disabled={isRevalidating || isSavingEditedIdea}
                    >
                      {isRevalidating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          Assessing
                        </>
                      ) : (
                        "Re-run initial assessment"
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Overall confidence
                      </p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {draftValidation.overallConfidence}%
                      </p>
                    </div>
                    {typeof validationDeltas.overallConfidence?.change === "number" && validationDeltas.overallConfidence.change !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                          validationDeltas.overallConfidence.change > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200",
                        )}
                      >
                        {validationDeltas.overallConfidence.change > 0 ? "+" : ""}
                        {validationDeltas.overallConfidence.change} pts since last run
                      </span>
                    )}
                  </div>
                  {isRevalidating ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      Re-assessing idea with the latest edits...
                    </div>
                  ) : (
                    <TooltipProvider>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {Object.entries(draftValidation.scores).map(([key, value]) => {
                          const label = PILLAR_KEY_TO_LABEL[key] || key;
                          const score = typeof value?.score === "number" ? value.score : 0;
                          const deltaInfo = validationDeltas[key];
                          const deltaValue =
                            typeof deltaInfo?.change === "number" && deltaInfo.change !== 0
                              ? deltaInfo.change
                              : null;
                          const DimensionIcon = dimensionIcons[key] || Info;
                          const impact = dimensionImpacts[key];
                          const impactBadge = getImpactBadge(score);
                          const impactStatement = getImpactStatement(key, score);
                          const isExpanded = expandedDimensions.has(key);

                          const toggleDimension = (dimension: string) => {
                            const newExpanded = new Set(expandedDimensions);
                            if (newExpanded.has(dimension)) {
                              newExpanded.delete(dimension);
                            } else {
                              newExpanded.add(dimension);
                            }
                            setExpandedDimensions(newExpanded);
                          };

                          return (
                            <div
                              key={key}
                              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <DimensionIcon className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                      <p className="text-sm font-semibold text-neutral-900">{label}</p>
                                      <span className={cn("text-xs px-2 py-0.5 rounded font-medium border", impactBadge.color)}>
                                        {impactBadge.label}
                                      </span>
                                    </div>
                                    {impact && (
                                      <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                                        {impact.whatItMeasures}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                                        aria-label={`Learn more about ${label}`}
                                      >
                                        <Info className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600 transition-colors" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md bg-neutral-900 text-neutral-50 border-neutral-700 p-4"
                                    >
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-xs font-semibold mb-1.5 text-neutral-300 uppercase tracking-wide">
                                            What This Measures
                                          </p>
                                          <p className="text-sm leading-relaxed">
                                            {impact?.whatItMeasures || value?.rationale || 'No description available.'}
                                          </p>
                                        </div>
                                        {impact && (
                                          <div className="border-t border-neutral-700 pt-3">
                                            <p className="text-xs font-semibold mb-2 text-neutral-300 uppercase tracking-wide">
                                              Scoring Factors
                                            </p>
                                            <ul className="space-y-1.5">
                                              {impact.scoringFactors.map((factor, idx) => (
                                                <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                                                  <span className="text-neutral-500 mt-1">•</span>
                                                  <span>{factor}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {impactStatement && (
                                          <div className="border-t border-neutral-700 pt-3">
                                            <p className="text-xs font-semibold mb-1.5 text-neutral-300 uppercase tracking-wide">
                                              Impact on Your Idea
                                            </p>
                                            <p className="text-xs text-neutral-300 leading-relaxed">
                                              {impactStatement}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-0.5 text-xs font-semibold",
                                      getScoreBadgeClasses(score),
                                    )}
                                  >
                                    {score}%
                                  </span>
                                </div>
                              </div>
                              <Progress value={score} className={cn("h-2", getProgressColor(score))} />
                              
                              {/* Impact Statement - "So What?" */}
                              {impactStatement && (
                                <div className={cn(
                                  "rounded-md p-3 border-l-4",
                                  score >= 70
                                    ? "bg-green-50 border-green-400"
                                    : score >= 40
                                    ? "bg-yellow-50 border-yellow-400"
                                    : "bg-red-50 border-red-400"
                                )}>
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className={cn(
                                      "h-4 w-4 mt-0.5 flex-shrink-0",
                                      score >= 70
                                        ? "text-green-600"
                                        : score >= 40
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold mb-1 text-neutral-900">
                                        So What? What This Means for Your Idea:
                                      </p>
                                      <p className="text-xs text-neutral-700 leading-relaxed">
                                        {impactStatement}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Expandable "Learn More" Section */}
                              {impact && (
                                <div className="border-t border-neutral-200 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleDimension(key)}
                                    className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors w-full"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                    <span>Learn more about this dimension</span>
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-3 space-y-3 pl-6">
                                      <div>
                                        <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                                          What This Measures
                                        </p>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                          {impact.whatItMeasures}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                                          Scoring Factors
                                        </p>
                                        <ul className="space-y-1">
                                          {impact.scoringFactors.map((factor, idx) => (
                                            <li key={idx} className="text-xs text-neutral-600 flex items-start gap-2">
                                              <span className="text-neutral-400 mt-1">•</span>
                                              <span>{factor}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-neutral-700 mb-1.5">
                                          Current Score Impact
                                        </p>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                          {impactStatement}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Delta indicator */}
                              {deltaValue !== null && (
                                <div className="border-t border-neutral-200 pt-2">
                                  <p
                                    className={cn(
                                      "text-xs font-medium",
                                      deltaValue > 0 ? "text-green-600" : "text-red-600",
                                    )}
                                  >
                                    {deltaValue > 0 ? "+" : ""}
                                    {deltaValue} pts vs last run
                                  </p>
                                </div>
                              )}

                              {/* Rationale */}
                              {value?.rationale && (
                                <div className="border-t border-neutral-200 pt-2">
                                  <p className="text-xs font-semibold text-neutral-700 mb-1">Analysis</p>
                                  <p className="text-xs text-neutral-600 leading-relaxed">{value.rationale}</p>
                                </div>
                              )}

                              {/* AI Suggestions for this pillar */}
                              {Array.isArray(refinementSuggestions) && refinementSuggestions.length > 0 && (() => {
                                const pillarSuggestions = refinementSuggestions.filter(
                                  (suggestion) => suggestion.pillarKey === key
                                );
                                if (pillarSuggestions.length === 0) return null;
                                
                                return pillarSuggestions.map((suggestion) => (
                                  <div key={suggestion.id} className="border-t border-purple-200 pt-3 mt-3">
                                    <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3 space-y-3">
                                      <div className="flex flex-wrap items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-purple-900">
                                            AI Suggestion
                                          </span>
                                          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                                            +{suggestion.estimatedImpact}% projected lift
                                          </span>
                                        </div>
                                      </div>
                                      <div className="rounded-md bg-purple-50/80 border border-purple-100 p-2.5 space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700">
                                          Weakness
                                        </p>
                                        <p className="text-xs text-purple-900">{suggestion.issue}</p>
                                        {typeof suggestion.score === "number" && (
                                          <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-medium text-purple-800">
                                              <span>Current {suggestion.score}%</span>
                                              <span>Target 85%</span>
                                            </div>
                                            <Progress
                                              value={Math.min(100, (suggestion.score / 85) * 100)}
                                              className="h-1.5 bg-purple-100 [&_[data-slot=progress-indicator]]:bg-purple-500"
                                            />
                                            <p className="text-[10px] text-purple-700">
                                              Needs +{Math.max(0, 85 - suggestion.score)} pts to hit target
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                          AI recommendation
                                        </p>
                                        <p className="text-xs text-neutral-900 mt-1">{suggestion.suggestion}</p>
                                      </div>
                                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <p className="text-[11px] text-neutral-500">
                                          {typeof suggestion.score === "number" && (
                                            <>
                                              After apply ≈{" "}
                                              {Math.min(85, suggestion.score + suggestion.estimatedImpact)}%
                                            </>
                                          )}
                                        </p>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 h-7 text-xs"
                                          onClick={() => handleApplySuggestion(suggestion)}
                                          disabled={
                                            applyingSuggestionId === suggestion.id ||
                                            isSavingEditedIdea ||
                                            isRevalidating
                                          }
                                        >
                                          {applyingSuggestionId === suggestion.id ? (
                                            <>
                                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                              Applying
                                            </>
                                          ) : (
                                            "Apply & revalidate"
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-900">AI Suggestions</p>
                    <p className="text-xs text-purple-700">
                      AI suggestions are now displayed directly within each pillar card above. Apply suggestions to improve weak pillars and re-run initial assessment.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-700 hover:text-purple-900"
                    onClick={() => {
                      if (draftValidation) {
                      const latestOverview = getCurrentAiProductOverview();
                      void loadPillarSuggestions(editForm.ideaText, draftValidation, latestOverview);
                      }
                    }}
                    disabled={suggestionsLoading || !draftValidation}
                  >
                    {suggestionsLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Re-running
                      </>
                    ) : (
                      "Re-run suggestions"
                    )}
                  </Button>
                </div>

                {suggestionError && (
                  <div className="rounded-lg border border-red-200 bg-white/70 p-3 text-sm text-red-700">
                    {suggestionError}
                  </div>
                )}

                {suggestionsLoading ? (
                  <div className="rounded-lg border border-dashed border-purple-200 bg-white/60 p-4 text-sm text-purple-800">
                    Generating pillar-aligned suggestions...
                  </div>
                ) : Array.isArray(refinementSuggestions) && refinementSuggestions.length === 0 ? (
                  <div className="rounded-lg border border-purple-100 bg-white/60 p-4 text-sm text-purple-800">
                    All pillars are above the target threshold. Great work!
                  </div>
                ) : !draftValidation ? (
                  <div className="rounded-lg border border-purple-100 bg-white/60 p-4 text-sm text-purple-800">
                    Run validation to see targeted suggestions.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleImproveExistingIdea}
                  variant="secondary"
                  disabled={isImprovingIdea || isSavingEditedIdea}
                  className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
                >
                  {isImprovingIdea ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Improve with AI
                    </>
                  )}
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSavingEditedIdea || isImprovingIdea}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditedIdea}
                  disabled={isSavingEditedIdea}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {isSavingEditedIdea ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Revalidate"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Initial Feedback intentionally hidden while editing */}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Main Idea Card */}
        <Card className="border border-neutral-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl font-semibold text-neutral-900">
                    {ideaInfo.title}
                  </CardTitle>
                  {modeText && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      {modeText}
                    </span>
                  )}
                </div>
                <CardDescription className="text-base text-neutral-600 leading-relaxed">
                  {ideaInfo.description}
                </CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleEditIdea}
                  variant="outline"
                >
                  Refine Idea
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        {(inputData.targetMarket || inputData.budget || inputData.timescales) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inputData.targetMarket && (
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Target Market</p>
                  <p className="text-base font-semibold text-neutral-900">
                    {inputData.targetMarket}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {inputData.budget && (
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Budget</p>
                  <p className="text-base font-semibold text-neutral-900">
                    {inputData.budget}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {inputData.timescales && (
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Timeline</p>
                  <p className="text-base font-semibold text-neutral-900">
                    {inputData.timescales}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        )}

        {/* Key Insights - What I Noticed */}
        {parsedReview.whatINoticed && parsedReview.whatINoticed.subsections && parsedReview.whatINoticed.subsections.length > 0 && (
          <Card className="border border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                {stripMarkdown(parsedReview.whatINoticed.title)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedReview.whatINoticed.subsections.map((subsection, idx) => (
                  <div key={idx} className="space-y-2 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                    <h4 className="font-semibold text-neutral-900 text-sm mb-2">{stripMarkdown(subsection.title)}</h4>
                    <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1">
                      <ReactMarkdown>
                        {subsection.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Assessment */}
        {parsedReview.overallAssessment && (
          <Card className="border border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-2 [&>strong]:font-semibold [&>strong]:text-neutral-900">
                <ReactMarkdown>
                  {parsedReview.overallAssessment}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths and Critical Areas - Side by Side */}
        {(parsedReview.strengths || parsedReview.criticalAreas) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedReview.strengths && (
              <Card className="border border-green-200 bg-green-50/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Strengths Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold">
                    <ReactMarkdown>
                      {parsedReview.strengths}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {parsedReview.criticalAreas && (
              <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Critical Areas Needing Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold">
                    <ReactMarkdown>
                      {parsedReview.criticalAreas}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recommendations and Next Steps */}
        {(parsedReview.recommendations || parsedReview.nextSteps) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedReview.recommendations && (
              <Card className="border border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold">
                    <ReactMarkdown>
                      {parsedReview.recommendations}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {parsedReview.nextSteps && (
              <Card className="border border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold">
                    <ReactMarkdown>
                      {parsedReview.nextSteps}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full AI Review Section - Collapsible */}
        <Card className="border border-neutral-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Complete AI Review
              </CardTitle>
              <Button
                onClick={() => setShowFullReview(!showFullReview)}
                variant="ghost"
                size="sm"
              >
                {showFullReview ? 'Hide Full Review' : 'Show Full Review'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showFullReview ? (
              <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-neutral-900 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-neutral-900 [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-2 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-2 [&>ol]:mb-3 [&>strong]:font-semibold [&>strong]:text-neutral-900 [&>li]:mb-1">
                <ReactMarkdown>
                  {aiReviewText}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none text-sm text-neutral-700 leading-relaxed [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h2]:text-neutral-900 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>strong]:font-semibold">
                  <ReactMarkdown>
                    {previewText}
                  </ReactMarkdown>
                </div>
                {!isComplete && (
                  <p className="text-xs text-neutral-500 italic">
                    Preview truncated at section boundary. Click "Show Full Review" to see complete analysis.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Initial Feedback Section */}
        {!isEditingExisting && savedInitialFeedback && (
          <div className="space-y-3">
            <div className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-900">Initial Feedback (saved)</span> – latest archived report
              from your last completed Ideate run.
            </div>
            <InitialFeedback feedback={savedInitialFeedback} scoreDeltas={feedbackDeltas} />
            
            {/* Score Change Explanation Section */}
            <ScoreChangeExplanation 
              feedbackDeltas={feedbackDeltas}
              currentFeedback={savedInitialFeedback}
              previousFeedback={previousFeedback}
            />
            
            <Card className="border border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-neutral-900">AI Improvements</CardTitle>
                    <CardDescription>Directly refine weak pillars and track diffs.</CardDescription>
                  </div>
                  <Button onClick={() => handleAutoImprove(95)} disabled={autoImproving} variant="default">
                    {autoImproving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Auto-improving…
                      </span>
                    ) : (
                      "Auto-Improve Idea to 95%"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(savedInitialFeedback.scores).map(([key, value]) => {
                    const scoreData = value as { score: number; rationale: string };
                    const numericScore = typeof scoreData?.score === "number" ? scoreData.score : 0;
                    return (
                      <div key={key} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-neutral-900">{PILLAR_KEY_TO_LABEL[key] || key}</div>
                          <span className="text-xs text-neutral-500">{numericScore}/100</span>
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">{scoreData?.rationale}</p>
                        {numericScore < 90 && (
                          <div className="space-y-2">
                            {pillarDirections[key]?.directions?.length ? (
                              <>
                                <div className="space-y-2">
                                  {pillarDirections[key]?.directions.map((direction) => (
                                    <div
                                      key={direction.id}
                                      className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <div className="text-sm font-semibold text-neutral-900">{direction.title}</div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                          {direction.description}
                                        </p>
                                      </div>
                                      <Button
                                        className="mt-3 w-full"
                                        variant="secondary"
                                        size="sm"
                                        disabled={(refineLoadingPillar?.startsWith(`${key}:`) ?? false) || autoImproving}
                                        onClick={() => handleRefinePillar(key, direction.id)}
                                      >
                                        {refineLoadingPillar === `${key}:${direction.id}` ? (
                                          <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Applying direction…
                                          </span>
                                        ) : (
                                          "Apply this direction"
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  disabled={(refineLoadingPillar?.startsWith(`${key}:`) ?? false) || autoImproving}
                                  onClick={() => handleRefinePillar(key, "auto")}
                                >
                                  {refineLoadingPillar === `${key}:auto` ? (
                                    <span className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Letting AI choose…
                                    </span>
                                  ) : (
                                    "Let AI choose for me"
                                  )}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={
                                    directionLoadingPillar === key || (refineLoadingPillar?.startsWith(`${key}:`) ?? false) || autoImproving
                                  }
                                  onClick={() => handleRefinePillar(key)}
                                  className="transition-all duration-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  {directionLoadingPillar === key ? (
                                    <span className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Gathering directions…
                                    </span>
                                  ) : (
                                    "Show improvement directions"
                                  )}
                                </Button>
                                {pillarDirectionErrors[key] && (
                                  <p className="text-xs text-red-600">{pillarDirectionErrors[key]}</p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <ImprovementHistory
                  entries={improvementLog}
                  autoImproving={autoImproving}
                  targetScore={95}
                  currentConfidence={typeof savedInitialFeedback.overallConfidence === "number" ? savedInitialFeedback.overallConfidence : null}
                  onApply={handleApplyImprovement}
                  onUndo={undoLastImprovement}
                  canUndo={overviewHistory.length > 0}
                />

                {refinedOverview && (() => {
                  // Get latest differences to determine which sections were updated
                  const latestDifferences = Array.isArray(
                    typeof savedData?.output === "object" && savedData.output
                      ? (savedData.output as { latestDifferences?: unknown }).latestDifferences
                      : null
                  )
                    ? ((savedData?.output as { latestDifferences?: unknown }).latestDifferences as SectionDiff[])
                    : [];

                  // Create a map of section keys to their differences
                  const sectionDiffMap = new Map<keyof ProductOverview, SectionDiff>();
                  latestDifferences.forEach((diff) => {
                    if (diff?.section) {
                      const sectionKey = SECTION_TITLE_TO_KEY[diff.section];
                      if (sectionKey) {
                        sectionDiffMap.set(sectionKey, diff);
                      }
                    }
                  });

                  // Helper to check if a section was updated and get its diff
                  const getSectionDiff = (key: keyof ProductOverview) => sectionDiffMap.get(key);
                  const isSectionUpdated = (key: keyof ProductOverview) => sectionDiffMap.has(key);

                  // Component for showing section with diff view
                  const SectionWithDiff = ({ 
                    title, 
                    sectionKey, 
                    content 
                  }: { 
                    title: string; 
                    sectionKey: keyof ProductOverview; 
                    content: string;
                  }) => {
                    const diff = getSectionDiff(sectionKey);
                    const updated = isSectionUpdated(sectionKey);
                    const [showDiff, setShowDiff] = useState(false);

                    return (
                      <div className={cn(
                        "space-y-2 rounded-md p-3 transition-colors",
                        updated && "bg-blue-50 border border-blue-200"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-neutral-900">{title}</div>
                            {updated && (
                              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                Updated
                              </span>
                            )}
                          </div>
                          {updated && diff && (
                            <button
                              type="button"
                              onClick={() => setShowDiff(!showDiff)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {showDiff ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Hide changes
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Show changes
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {updated && diff && showDiff && (
                          <div className="mt-3 space-y-3 rounded-md border border-blue-200 bg-white p-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-red-700 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Before
                                </div>
                                <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap bg-red-50 p-2 rounded border border-red-100">
                                  {diff.before || '—'}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-green-700 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  After
                                </div>
                                <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap bg-green-50 p-2 rounded border border-green-100">
                                  {diff.after || '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-neutral-700">
                          <FormattedOverviewText content={content} />
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-neutral-900">Refined Overview</h4>
                        <span className="text-xs text-neutral-500">Live preview</span>
                      </div>
                      <div className="space-y-4 text-sm text-neutral-800">
                        <SectionWithDiff 
                          title="Pitch" 
                          sectionKey="refinedPitch" 
                          content={refinedOverview.refinedPitch} 
                        />
                        <SectionWithDiff 
                          title="Problem" 
                          sectionKey="problemSummary" 
                          content={refinedOverview.problemSummary} 
                        />
                        <SectionWithDiff 
                          title="Solution" 
                          sectionKey="solution" 
                          content={refinedOverview.solution} 
                        />
                        <SectionWithDiff 
                          title="Competition" 
                          sectionKey="competition" 
                          content={refinedOverview.competition} 
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Step {currentStep} of 3</h2>
          <span className="text-sm text-neutral-600">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step 1: Mode Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900">How would you like to generate ideas?</h1>
            <p className="text-base text-neutral-600">
              Choose the approach that best matches your current situation.
            </p>
          </div>

          <RadioGroup value={selectedMode || ""} onValueChange={(value) => setSelectedMode(value as Mode)}>
            <div className="space-y-4">
              <label
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedMode === "explore-idea"
                    ? "border-purple-600 bg-purple-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
              >
                <RadioGroupItem value="explore-idea" id="explore-idea" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="explore-idea" className="text-base font-semibold text-neutral-900 cursor-pointer">
                    Explore an idea
                  </Label>
                  <p className="text-sm text-neutral-600 mt-1">
                    You have a startup idea and want to explore its potential, develop it further, and refine the concept.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedMode === "solve-problem"
                    ? "border-purple-600 bg-purple-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
              >
                <RadioGroupItem value="solve-problem" id="solve-problem" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="solve-problem" className="text-base font-semibold text-neutral-900 cursor-pointer">
                    Solve a problem
                  </Label>
                  <p className="text-sm text-neutral-600 mt-1">
                    You've identified a problem and want to generate innovative solutions and startup ideas to address it.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedMode === "surprise-me"
                    ? "border-purple-600 bg-purple-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
              >
                <RadioGroupItem value="surprise-me" id="surprise-me" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="surprise-me" className="text-base font-semibold text-neutral-900 cursor-pointer">
                    Surprise me
                  </Label>
                  <p className="text-sm text-neutral-600 mt-1">
                    Let AI generate creative and innovative startup ideas for you based on current market trends and opportunities.
                  </p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* Next Button - Bottom Right */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Input/Generation */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {selectedMode === "explore-idea" && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-neutral-900">Describe Your Idea</h1>
                <p className="text-base text-neutral-600">
                  Tell us about your startup idea. What is it? What problem does it solve? Who would use it?
                </p>
              </div>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Describe your idea here... What is it? What problem does it solve? Who would use it?"
                className="min-h-[150px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
              />
            </>
          )}

          {selectedMode === "solve-problem" && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-neutral-900">Describe the Problem</h1>
                <p className="text-base text-neutral-600">
                  Clearly describe the problem you want to solve. What pain point are you addressing? Who experiences this problem?
                </p>
              </div>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Describe the problem you want to solve... What pain point are you addressing? Who experiences this problem?"
                className="min-h-[150px] border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
              />
            </>
          )}

          {selectedMode === "surprise-me" && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-neutral-900">Help us generate better ideas</h1>
                <p className="text-base text-neutral-600">
                  Answer a few optional questions to help us tailor the AI-generated ideas to your preferences. You'll see the ideas on the next page.
                </p>
                {ideaGenerationError && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mt-2">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Note:</span> {ideaGenerationError}. Showing sample ideas.
                    </p>
                  </div>
                )}
              </div>

              <Card className="border border-neutral-200 bg-white">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="surprise-target-market" className="text-sm font-medium text-neutral-700">
                      Target Market <span className="text-neutral-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="surprise-target-market"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="e.g., Healthcare, Fintech, EdTech"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surprise-target-country" className="text-sm font-medium text-neutral-700">
                      Target Country <span className="text-neutral-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="surprise-target-country"
                      value={targetCountry}
                      onChange={(e) => setTargetCountry(e.target.value)}
                      placeholder="e.g., United States, United Kingdom, Global"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surprise-budget" className="text-sm font-medium text-neutral-700">
                      My Budget <span className="text-neutral-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="surprise-budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g., $10K, $50K, Bootstrapped"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surprise-timescales" className="text-sm font-medium text-neutral-700">
                      Timescales <span className="text-neutral-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="surprise-timescales"
                      value={timescales}
                      onChange={(e) => setTimescales(e.target.value)}
                      placeholder="e.g., 3 months, 6 months, 1 year"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              disabled={isGeneratingIdeas}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isGeneratingIdeas}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isGeneratingIdeas ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Generating Ideas...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* AI Review Screen */}
      {showReview && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900">AI Review</h1>
            <p className="text-base text-neutral-600">
              Here's what our AI thinks about your idea:
            </p>
          </div>

          <Card className="border border-neutral-200 bg-white">
            <CardContent className="pt-6">
              {isLoadingReview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <p className="text-sm text-neutral-600">Generating AI review...</p>
                  </div>
                  <p className="text-sm text-neutral-500">This may take a few moments.</p>
                </div>
              ) : reviewError ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                    <p className="text-sm font-medium text-yellow-800">Warning: {reviewError}</p>
                    <p className="text-sm text-yellow-700 mt-1">Showing a mock review as fallback.</p>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-neutral-700">{aiReview}</div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-neutral-700">{aiReview}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Initial Feedback Section */}
          {!isLoadingReview && (
            <>
              {isLoadingInitialFeedback ? (
                <Card className="border border-neutral-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <p className="text-sm text-neutral-600">Generating initial feedback...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : initialFeedback ? (
                <InitialFeedback feedback={initialFeedback} />
              ) : null}
            </>
          )}

          {!isLoadingReview && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCompleteWizard}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Complete
              </Button>
            </div>
          )}
        </div>
      )}


      {/* Step 3: Idea Selection or Optional Advanced Options */}
      {currentStep === 3 && !showReview && (
        <div className="space-y-6">
          {/* Show idea selection for all modes if ideas are generated */}
          {ideasGenerated && generatedIdeas.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-neutral-900">
                  {selectedMode === "surprise-me" 
                    ? "Select Your Idea" 
                    : "Select a Direction to Explore"}
                </h1>
                <p className="text-base text-neutral-600">
                  {selectedMode === "surprise-me"
                    ? "Choose one of the generated ideas to proceed. We'll review it with AI next."
                    : "Choose one of the directions to develop your idea. We'll review it with AI next."}
                </p>
              </div>
              
              <RadioGroup value={selectedIdeaId || ""} onValueChange={setSelectedIdeaId}>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {generatedIdeas.map((idea) => (
                    <label
                      key={idea.id}
                      className={cn(
                        "flex flex-col cursor-pointer rounded-xl border-2 transition-all duration-200",
                        "hover:shadow-lg hover:border-purple-400",
                        selectedIdeaId === idea.id
                          ? "border-purple-600 bg-purple-50 shadow-md ring-2 ring-purple-200"
                          : "border-neutral-200 bg-white"
                      )}
                    >
                      <Card className="border-0 shadow-none bg-transparent">
                        <CardHeader className="pb-4 pt-6 px-6">
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={idea.id} id={idea.id} className="mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              {idea.title.includes(' - ') ? (
                                <>
                                  <CardTitle className="text-xl font-bold text-neutral-900 cursor-pointer leading-tight mb-1">
                                    {idea.title.split(' - ')[0]}
                                  </CardTitle>
                                  <p className="text-sm font-medium text-purple-700 mb-2 leading-snug">
                                    {idea.title.split(' - ').slice(1).join(' - ')}
                                  </p>
                                </>
                              ) : (
                                <CardTitle className="text-xl font-bold text-neutral-900 cursor-pointer leading-tight mb-2">
                                  {idea.title}
                                </CardTitle>
                              )}
                              <div className="h-px bg-gradient-to-r from-purple-200 via-neutral-200 to-transparent mt-3"></div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 px-6 pb-6">
                          <div className="min-h-[120px]">
                            <IdeaDescription 
                              description={idea.description}
                              ideaId={idea.id}
                              isExpanded={expandedIdeas[idea.id] || false}
                              onToggleExpand={() => setExpandedIdeas(prev => ({
                                ...prev,
                                [idea.id]: !prev[idea.id]
                              }))}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  ))}
                </div>
              </RadioGroup>
              
              {ideaGenerationError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{ideaGenerationError}</p>
                </div>
              )}
            </div>
          ) : isGeneratingIdeas ? (
            // Show loading state
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">Generating ideas...</p>
              </div>
            </div>
          ) : (
            // Show error or empty state
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                {ideaGenerationError || "No ideas generated yet. Please go back and try again."}
              </p>
            </div>
          )}

          {/* Optional Advanced Options - show below idea selection for non-surprise-me modes */}
          {selectedMode !== "surprise-me" && ideasGenerated && generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center justify-between w-full p-4 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-left"
              >
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Optional Advanced Options</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Provide additional context to help refine your idea review. All fields are optional.
                  </p>
                </div>
                {showAdvancedOptions ? (
                  <ChevronUp className="h-5 w-5 text-neutral-500 shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-500 shrink-0 ml-4" />
                )}
              </button>

              {showAdvancedOptions && (
                <Card className="border border-neutral-200 bg-white">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="target-market" className="text-sm font-medium text-neutral-700">
                      Target Market
                    </Label>
                    <Input
                      id="target-market"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="e.g., Healthcare, Fintech, EdTech"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-country" className="text-sm font-medium text-neutral-700">
                      Target Country
                    </Label>
                    <Input
                      id="target-country"
                      value={targetCountry}
                      onChange={(e) => setTargetCountry(e.target.value)}
                      placeholder="e.g., United States, United Kingdom, Global"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium text-neutral-700">
                      My Budget
                    </Label>
                    <Input
                      id="budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g., $10K, $50K, Bootstrapped"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timescales" className="text-sm font-medium text-neutral-700">
                      Timescales
                    </Label>
                    <Input
                      id="timescales"
                      value={timescales}
                      onChange={(e) => setTimescales(e.target.value)}
                      placeholder="e.g., 3 months, 6 months, 1 year"
                      className="border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            >
              Back
            </Button>
            <Button
              onClick={handleFinish}
              disabled={!canProceed() || isLoadingReview || isGeneratingIdeas}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isLoadingReview ? "Generating Review..." : isGeneratingIdeas ? "Generating Ideas..." : "Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
