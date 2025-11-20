export const BUILD_PATHS = {
  AI_TOOL: "ai_tool",
  HIRE_DEV: "hire_dev",
  ADVANCED: "advanced",
} as const;

export type BuildPath = typeof BUILD_PATHS[keyof typeof BUILD_PATHS];

export const INTEGRATION_CATEGORIES = [
  { id: "auth", label: "Authentication", providers: ["Clerk", "Auth0", "Supabase Auth", "NextAuth"] },
  { id: "payments", label: "Payments", providers: ["Stripe", "PayPal", "Square"] },
  { id: "email", label: "Email", providers: ["SendGrid", "Resend", "Mailgun", "Postmark"] },
  { id: "notifications", label: "Notifications", providers: ["OneSignal", "Pusher", "Firebase Cloud Messaging"] },
  { id: "ai", label: "AI Services", providers: ["OpenAI", "Anthropic", "Google AI"] },
  { id: "analytics", label: "Analytics", providers: ["Google Analytics", "Mixpanel", "PostHog", "Plausible"] },
  { id: "storage", label: "Storage", providers: ["AWS S3", "Cloudinary", "Supabase Storage", "Vercel Blob"] },
] as const;

export const BUILD_SECTIONS = [
  "mvp_scope",
  "features",
  "data_model",
  "screens",
  "integrations",
  "developer_pack",
] as const;

export type BuildSection = typeof BUILD_SECTIONS[number];

export const SECTION_LABELS: Record<BuildSection, string> = {
  mvp_scope: "MVP Scope",
  features: "Features & User Stories",
  data_model: "Data Model",
  screens: "Screens & Components",
  integrations: "Integrations",
  developer_pack: "Developer Pack",
};

