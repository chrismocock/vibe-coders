-- Create launch_blueprints table for comprehensive launch stage data
CREATE TABLE IF NOT EXISTS public.launch_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  launch_path_choice TEXT,
  strategy_plan JSONB,
  messaging_framework JSONB,
  landing_onboarding JSONB,
  early_adopters JSONB,
  marketing_assets JSONB,
  tracking_metrics JSONB,
  launch_pack JSONB,
  section_completion JSONB DEFAULT '{}'::jsonb,
  build_path_snapshot TEXT,
  last_ai_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on project_id and created_at for faster lookups
CREATE INDEX IF NOT EXISTS launch_blueprints_project_created_idx
  ON public.launch_blueprints(project_id, created_at DESC);

-- Create unique index to ensure one blueprint per project
CREATE UNIQUE INDEX IF NOT EXISTS launch_blueprints_project_unique_idx
  ON public.launch_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.launch_blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read launch blueprints for their own projects
CREATE POLICY "Users can read their own launch blueprints"
  ON public.launch_blueprints FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert launch blueprints for their own projects
CREATE POLICY "Users can insert launch blueprints for their projects"
  ON public.launch_blueprints FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update launch blueprints for their own projects
CREATE POLICY "Users can update their own launch blueprints"
  ON public.launch_blueprints FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete launch blueprints for their own projects
CREATE POLICY "Users can delete their own launch blueprints"
  ON public.launch_blueprints FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_launch_blueprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER launch_blueprints_updated_at
  BEFORE UPDATE ON public.launch_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_launch_blueprints_updated_at();

