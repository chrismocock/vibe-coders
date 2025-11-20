export const LAUNCH_SECTIONS = {
  OVERVIEW: "overview",
  STRATEGY: "strategy",
  MESSAGING: "messaging",
  LANDING: "landing",
  ADOPTERS: "adopters",
  ASSETS: "assets",
  METRICS: "metrics",
  PACK: "pack",
} as const;

export const LAUNCH_PATH_CHOICES = {
  SOFT_LAUNCH: "soft_launch",
  PUBLIC_LAUNCH: "public_launch",
  PRIVATE_BETA: "private_beta",
} as const;

export const TONE_OPTIONS = ["fun", "serious", "hype", "minimalist"] as const;

export const ASSET_TYPES = [
  "tweet_thread",
  "facebook_post",
  "linkedin_announcement",
  "instagram_caption",
  "product_hunt_blurb",
  "demo_script",
  "press_release",
] as const;

export const METRIC_TYPES = [
  "signups",
  "activations",
  "paying_users",
  "usage_frequency",
  "retention",
] as const;

export const DELIVERABLES = [
  { id: LAUNCH_SECTIONS.OVERVIEW, label: "Launch Path Selected", required: true },
  { id: LAUNCH_SECTIONS.STRATEGY, label: "Launch Strategy Plan", required: true },
  { id: LAUNCH_SECTIONS.MESSAGING, label: "Messaging Framework", required: true },
  { id: LAUNCH_SECTIONS.LANDING, label: "Landing Page & Onboarding", required: true },
  { id: LAUNCH_SECTIONS.ADOPTERS, label: "Early Adopters Plan", required: true },
  { id: LAUNCH_SECTIONS.ASSETS, label: "Marketing Assets", required: true },
  { id: LAUNCH_SECTIONS.METRICS, label: "Tracking & Metrics", required: true },
  { id: LAUNCH_SECTIONS.PACK, label: "Launch Pack", required: true },
] as const;

