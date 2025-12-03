-- Create design_blueprints table for comprehensive design stage data
CREATE TABLE IF NOT EXISTS public.design_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  product_blueprint JSONB,
  user_personas JSONB,
  user_journey JSONB,
  information_architecture JSONB,
  wireframes JSONB,
  brand_identity JSONB,
  mvp_definition JSONB,
  design_summary JSONB,
  rendered_markdown TEXT,
  section_completion JSONB DEFAULT '{}'::jsonb,
  last_ai_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on project_id and created_at for faster lookups
CREATE INDEX IF NOT EXISTS design_blueprints_project_created_idx
  ON public.design_blueprints(project_id, created_at DESC);

-- Create unique index to ensure one blueprint per project
CREATE UNIQUE INDEX IF NOT EXISTS design_blueprints_project_unique_idx
  ON public.design_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.design_blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read design blueprints for their own projects
CREATE POLICY "Users can read their own design blueprints"
  ON public.design_blueprints FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert design blueprints for their own projects
CREATE POLICY "Users can insert design blueprints for their projects"
  ON public.design_blueprints FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update design blueprints for their own projects
CREATE POLICY "Users can update their own design blueprints"
  ON public.design_blueprints FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete design blueprints for their own projects
CREATE POLICY "Users can delete their own design blueprints"
  ON public.design_blueprints FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_design_blueprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER design_blueprints_updated_at
  BEFORE UPDATE ON public.design_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_design_blueprints_updated_at();

