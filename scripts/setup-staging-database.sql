-- Setup script for Staging Database
-- Run this in your Staging Supabase project's SQL Editor
-- This creates all tables needed for the application

-- 1. Create projects table (base table, no dependencies)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Service role can manage all projects" ON public.projects;

-- RLS Policy: Users can read their own projects
CREATE POLICY "Users can read their own projects"
  ON public.projects FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Service role bypass policy (for data migration scripts)
-- Note: Service role should bypass RLS automatically, but this policy ensures it works
CREATE POLICY "Service role can manage all projects"
  ON public.projects
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 2. Create ai_configs table (no dependencies)
CREATE TABLE IF NOT EXISTS public.ai_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE public.ai_configs 
  ADD COLUMN IF NOT EXISTS system_prompt_idea TEXT;
ALTER TABLE public.ai_configs 
  ADD COLUMN IF NOT EXISTS system_prompt_problem TEXT;

-- Create index on stage for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_configs_stage ON public.ai_configs(stage);

-- 3. Create project_stages table (depends on projects)
CREATE TABLE IF NOT EXISTS public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS project_stages_project_id_idx ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS project_stages_user_id_idx ON public.project_stages(user_id);
CREATE INDEX IF NOT EXISTS project_stages_stage_idx ON public.project_stages(stage);

-- Enable RLS
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own project stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can insert their own project stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can update their own project stages" ON public.project_stages;
DROP POLICY IF EXISTS "Users can delete their own project stages" ON public.project_stages;
DROP POLICY IF EXISTS "Service role can manage all project stages" ON public.project_stages;

-- RLS Policy: Users can read their own project stages
CREATE POLICY "Users can read their own project stages"
  ON public.project_stages FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can insert their own project stages
CREATE POLICY "Users can insert their own project stages"
  ON public.project_stages FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can update their own project stages
CREATE POLICY "Users can update their own project stages"
  ON public.project_stages FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- RLS Policy: Users can delete their own project stages
CREATE POLICY "Users can delete their own project stages"
  ON public.project_stages FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all project stages"
  ON public.project_stages
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 4. Create validation_reports table (depends on projects)
CREATE TABLE IF NOT EXISTS public.validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  idea_title TEXT NOT NULL,
  idea_summary TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  scores JSONB,
  overall_confidence INTEGER,
  recommendation TEXT CHECK (recommendation IN ('build', 'revise', 'drop')),
  rationales JSONB,
  agent_details JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE public.validation_reports 
  ADD COLUMN IF NOT EXISTS section_results JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.validation_reports 
  ADD COLUMN IF NOT EXISTS completed_actions JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS validation_reports_project_created_idx
  ON public.validation_reports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS validation_reports_status_idx
  ON public.validation_reports(status);
CREATE INDEX IF NOT EXISTS validation_reports_section_results_idx 
  ON public.validation_reports USING GIN (section_results);
CREATE INDEX IF NOT EXISTS validation_reports_completed_actions_idx 
  ON public.validation_reports USING GIN (completed_actions);

-- Enable RLS
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own validation reports" ON public.validation_reports;
DROP POLICY IF EXISTS "Users can insert validation reports for their projects" ON public.validation_reports;
DROP POLICY IF EXISTS "Users can update their own validation reports" ON public.validation_reports;
DROP POLICY IF EXISTS "Service role can manage all validation reports" ON public.validation_reports;

-- RLS Policy: Users can read validation reports for their own projects
CREATE POLICY "Users can read their own validation reports"
  ON public.validation_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = validation_reports.project_id
        AND p.user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
    )
  );

-- RLS Policy: Users can insert validation reports for their own projects
CREATE POLICY "Users can insert validation reports for their projects"
  ON public.validation_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
    )
  );

-- RLS Policy: Users can update validation reports for their own projects
CREATE POLICY "Users can update their own validation reports"
  ON public.validation_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = validation_reports.project_id
        AND p.user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
    )
  );

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all validation reports"
  ON public.validation_reports
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_validation_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER validation_reports_updated_at
  BEFORE UPDATE ON public.validation_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_validation_reports_updated_at();

-- 5. Create design_blueprints table (depends on projects)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS design_blueprints_project_created_idx
  ON public.design_blueprints(project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS design_blueprints_project_unique_idx
  ON public.design_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.design_blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own design blueprints" ON public.design_blueprints;
DROP POLICY IF EXISTS "Users can insert design blueprints for their projects" ON public.design_blueprints;
DROP POLICY IF EXISTS "Users can update their own design blueprints" ON public.design_blueprints;
DROP POLICY IF EXISTS "Service role can manage all design blueprints" ON public.design_blueprints;

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

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all design blueprints"
  ON public.design_blueprints
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 6. Create build_blueprints table (depends on projects)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS build_blueprints_project_created_idx
  ON public.build_blueprints(project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS build_blueprints_project_unique_idx
  ON public.build_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.build_blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own build blueprints" ON public.build_blueprints;
DROP POLICY IF EXISTS "Users can insert build blueprints for their projects" ON public.build_blueprints;
DROP POLICY IF EXISTS "Users can update their own build blueprints" ON public.build_blueprints;
DROP POLICY IF EXISTS "Users can delete their own build blueprints" ON public.build_blueprints;
DROP POLICY IF EXISTS "Service role can manage all build blueprints" ON public.build_blueprints;

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

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all build blueprints"
  ON public.build_blueprints
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 7. Create launch_blueprints table (depends on projects)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS launch_blueprints_project_created_idx
  ON public.launch_blueprints(project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS launch_blueprints_project_unique_idx
  ON public.launch_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.launch_blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own launch blueprints" ON public.launch_blueprints;
DROP POLICY IF EXISTS "Users can insert launch blueprints for their projects" ON public.launch_blueprints;
DROP POLICY IF EXISTS "Users can update their own launch blueprints" ON public.launch_blueprints;
DROP POLICY IF EXISTS "Service role can manage all launch blueprints" ON public.launch_blueprints;

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

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all launch blueprints"
  ON public.launch_blueprints
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- 8. Create monetise_blueprints table (depends on projects)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS monetise_blueprints_project_created_idx
  ON public.monetise_blueprints(project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS monetise_blueprints_project_unique_idx
  ON public.monetise_blueprints(project_id);

-- Enable RLS
ALTER TABLE public.monetise_blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read their own monetise blueprints" ON public.monetise_blueprints;
DROP POLICY IF EXISTS "Users can insert monetise blueprints for their projects" ON public.monetise_blueprints;
DROP POLICY IF EXISTS "Users can update their own monetise blueprints" ON public.monetise_blueprints;
DROP POLICY IF EXISTS "Service role can manage all monetise blueprints" ON public.monetise_blueprints;

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

-- Service role bypass policy (for data migration scripts)
CREATE POLICY "Service role can manage all monetise blueprints"
  ON public.monetise_blueprints
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

