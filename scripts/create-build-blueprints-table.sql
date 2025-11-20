-- Create build_blueprints table for comprehensive build stage data
CREATE TABLE IF NOT EXISTS public.build_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  build_path TEXT,
  mvp_scope JSONB,
  feature_specs JSONB,
  data_model JSONB,
  screens_components JSONB,
  integrations JSONB,
  developer_pack JSONB,
  section_completion JSONB DEFAULT '{}'::jsonb,
  last_ai_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on project_id and created_at for faster lookups
CREATE INDEX IF NOT EXISTS build_blueprints_project_created_idx
  ON public.build_blueprints(project_id, created_at DESC);

-- Create unique index to ensure one blueprint per project
CREATE UNIQUE INDEX IF NOT EXISTS build_blueprints_project_unique_idx
  ON public.build_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.build_blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read build blueprints for their own projects
CREATE POLICY "Users can read their own build blueprints"
  ON public.build_blueprints FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert build blueprints for their own projects
CREATE POLICY "Users can insert build blueprints for their projects"
  ON public.build_blueprints FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update build blueprints for their own projects
CREATE POLICY "Users can update their own build blueprints"
  ON public.build_blueprints FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete build blueprints for their own projects
CREATE POLICY "Users can delete their own build blueprints"
  ON public.build_blueprints FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_build_blueprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER build_blueprints_updated_at
  BEFORE UPDATE ON public.build_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_build_blueprints_updated_at();

