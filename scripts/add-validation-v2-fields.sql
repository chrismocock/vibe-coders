-- Adds structured JSON columns required for Validation V2 experience.
ALTER TABLE public.validation_reports
  ADD COLUMN IF NOT EXISTS opportunity_score INTEGER,
  ADD COLUMN IF NOT EXISTS risk_radar JSONB,
  ADD COLUMN IF NOT EXISTS opportunity_score_detail JSONB,
  ADD COLUMN IF NOT EXISTS personas JSONB,
  ADD COLUMN IF NOT EXISTS feature_map JSONB,
  ADD COLUMN IF NOT EXISTS idea_enhancement JSONB,
  ADD COLUMN IF NOT EXISTS persona_reactions JSONB,
  ADD COLUMN IF NOT EXISTS design_brief JSONB,
  ADD COLUMN IF NOT EXISTS analysis_feed JSONB;

COMMENT ON COLUMN public.validation_reports.opportunity_score IS
  'Aggregated score combining market momentum, audience enthusiasm, and feasibility.';

COMMENT ON COLUMN public.validation_reports.risk_radar IS
  'JSON object with risk values for market, competition, technical, monetisation, and GTM dimensions.';

COMMENT ON COLUMN public.validation_reports.opportunity_score_detail IS
  'JSON object containing the component metrics and rationale for the opportunity score.';

COMMENT ON COLUMN public.validation_reports.personas IS
  'Generated persona models available at both overview and audience levels.';

COMMENT ON COLUMN public.validation_reports.feature_map IS
  'Opportunity map describing must/should/could/avoid feature tiers.';

COMMENT ON COLUMN public.validation_reports.idea_enhancement IS
  'Idea enhancer insights including positioning upgrades and differentiators.';

COMMENT ON COLUMN public.validation_reports.persona_reactions IS
  'Per-section persona reaction summaries for contextual decision making.';

COMMENT ON COLUMN public.validation_reports.design_brief IS
  'Pre-populated design brief payload used to seed the Design stage.';

COMMENT ON COLUMN public.validation_reports.analysis_feed IS
  'Progress feed messages that power the enhanced validation loading state.';

