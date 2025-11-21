export const STAGE_ORDER = [
  "dashboard",
  "ideate",
  "validate",
  "design",
  "build",
  "launch",
  "monetise",
] as const;

export type StageId = (typeof STAGE_ORDER)[number];

export const STAGE_LABELS: Record<StageId, string> = {
  dashboard: "Dashboard",
  ideate: "Ideate",
  validate: "Validate",
  design: "Design",
  build: "Build",
  launch: "Launch",
  monetise: "Monetise",
};

export interface SubStageDefinition {
  id: string;
  label: string;
}

export const VALIDATE_SUB_STAGES: SubStageDefinition[] = [
  { id: "", label: "Overview" },
  { id: "problem", label: "Problem" },
  { id: "market", label: "Market" },
  { id: "competition", label: "Competition" },
  { id: "audience", label: "Audience" },
  { id: "feasibility", label: "Feasibility" },
  { id: "pricing", label: "Pricing" },
  { id: "go-to-market", label: "Go-To-Market" },
];

export const DESIGN_SUB_STAGES: SubStageDefinition[] = [
  { id: "", label: "Overview" },
  { id: "product-blueprint", label: "Product Blueprint" },
  { id: "user-personas", label: "User Personas" },
  { id: "user-journey", label: "User Journey" },
  { id: "information-architecture", label: "Information Architecture" },
  { id: "wireframes", label: "Wireframes & Layouts" },
  { id: "brand-identity", label: "Brand & Visual Identity" },
  { id: "mvp-definition", label: "MVP Definition" },
  { id: "design-summary", label: "Design Summary & Export" },
];

export const BUILD_SUB_STAGES: SubStageDefinition[] = [
  { id: "", label: "Overview" },
  { id: "mvp-scope", label: "MVP Scope" },
  { id: "features", label: "Features & User Stories" },
  { id: "data-model", label: "Data Model" },
  { id: "screens", label: "Screens & Components" },
  { id: "technical", label: "Technical Architecture" },
  { id: "integrations", label: "Integrations" },
  { id: "developer-pack", label: "Developer Pack" },
  { id: "planning", label: "Execution Planning" },
];

export const LAUNCH_SUB_STAGES: SubStageDefinition[] = [
  { id: "", label: "Overview" },
  { id: "planning", label: "Launch Planning" },
  { id: "strategy", label: "Strategy" },
  { id: "messaging", label: "Messaging" },
  { id: "assets", label: "Assets" },
  { id: "metrics", label: "Tracking & Metrics" },
  { id: "pack", label: "Launch Pack" },
  { id: "adopters", label: "Adopters" },
  { id: "growth", label: "Growth" },
  { id: "tactics", label: "Tactics" },
  { id: "landing", label: "Landing Page" },
];

export const MONETISE_SUB_STAGES: SubStageDefinition[] = [
  { id: "", label: "Overview" },
  { id: "goals", label: "Goals" },
  { id: "model", label: "Model" },
  { id: "pricing", label: "Pricing Strategy" },
  { id: "offer", label: "Offer & Plan Builder" },
  { id: "checkout", label: "Checkout & Payment Flow" },
  { id: "activation", label: "Activation & Onboarding" },
  { id: "assets", label: "Monetisation Assets" },
  { id: "pack", label: "Revenue Pack" },
  { id: "economics", label: "Economics" },
];

export const STAGE_SUB_STAGES: Partial<Record<StageId, SubStageDefinition[]>> = {
  validate: VALIDATE_SUB_STAGES,
  design: DESIGN_SUB_STAGES,
  build: BUILD_SUB_STAGES,
  launch: LAUNCH_SUB_STAGES,
  monetise: MONETISE_SUB_STAGES,
};

