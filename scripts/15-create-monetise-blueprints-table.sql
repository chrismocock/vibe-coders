-- Create monetise_blueprints table for comprehensive monetise stage data
CREATE TABLE IF NOT EXISTS public.monetise_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  monetisation_model TEXT,
  pricing_strategy JSONB,
  offer_plan JSONB,
  checkout_flow JSONB,
  activation_blueprint JSONB,
  monetisation_assets JSONB,
  revenue_pack JSONB,
  section_completion JSONB DEFAULT '{}'::jsonb,
  build_path_snapshot TEXT,
  last_ai_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on project_id and created_at for faster lookups
CREATE INDEX IF NOT EXISTS monetise_blueprints_project_created_idx
  ON public.monetise_blueprints(project_id, created_at DESC);

-- Create unique index to ensure one blueprint per project
CREATE UNIQUE INDEX IF NOT EXISTS monetise_blueprints_project_unique_idx
  ON public.monetise_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.monetise_blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read monetise blueprints for their own projects
CREATE POLICY "Users can read their own monetise blueprints"
  ON public.monetise_blueprints FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert monetise blueprints for their own projects
CREATE POLICY "Users can insert monetise blueprints for their projects"
  ON public.monetise_blueprints FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update monetise blueprints for their own projects
CREATE POLICY "Users can update their own monetise blueprints"
  ON public.monetise_blueprints FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete monetise blueprints for their own projects
CREATE POLICY "Users can delete their own monetise blueprints"
  ON public.monetise_blueprints FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monetise_blueprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER monetise_blueprints_updated_at
  BEFORE UPDATE ON public.monetise_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_monetise_blueprints_updated_at();

