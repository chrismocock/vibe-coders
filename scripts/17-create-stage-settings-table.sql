-- Create table to control which journey stages and sub-pages are enabled
CREATE TABLE IF NOT EXISTS public.stage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL,
  sub_stage text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure one row per (stage, sub_stage) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_stage_settings_unique
  ON public.stage_settings(stage, COALESCE(sub_stage, ''));

COMMENT ON TABLE public.stage_settings IS 'Global enable/disable flags for journey stages and sub-pages.';

