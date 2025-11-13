export const MONETISE_SECTIONS = {
  OVERVIEW: "overview",
  PRICING: "pricing",
  OFFER: "offer",
  CHECKOUT: "checkout",
  ACTIVATION: "activation",
  ASSETS: "assets",
  PACK: "pack",
} as const;

export const MONETISATION_MODELS = {
  SUBSCRIPTION: "subscription",
  ONE_TIME: "one_time",
  FREEMIUM: "freemium",
  USAGE_BASED: "usage_based",
  HYBRID: "hybrid",
} as const;

export const TONE_OPTIONS = ["minimal", "professional", "hype", "founder_story"] as const;

export const ASSET_TYPES = [
  "sales_page",
  "pricing_table",
  "faq",
  "testimonial",
  "social_proof",
  "upsell",
  "value_stack",
  "guarantee",
] as const;

export const DELIVERABLES = [
  { id: MONETISE_SECTIONS.OVERVIEW, label: "Monetisation Model Selected", required: true },
  { id: MONETISE_SECTIONS.PRICING, label: "Pricing Strategy", required: true },
  { id: MONETISE_SECTIONS.OFFER, label: "Offer & Plan Builder", required: true },
  { id: MONETISE_SECTIONS.CHECKOUT, label: "Checkout & Payment Flow", required: true },
  { id: MONETISE_SECTIONS.ACTIVATION, label: "Activation & Onboarding", required: true },
  { id: MONETISE_SECTIONS.ASSETS, label: "Monetisation Assets", required: true },
  { id: MONETISE_SECTIONS.PACK, label: "Revenue Pack", required: true },
] as const;

