-- ============================================================================
-- MASTER DATABASE SETUP SCRIPT
-- ============================================================================
-- This script combines all SQL migrations EXCEPT 08-add-ideate-review-user-prompt.sql
-- 
-- Included scripts:
--   - 20-setup-staging-database.sql (base tables)
--   - 02-add-ideate-prompt-columns.sql
--   - 03-add-ideate-system-prompts.sql
--   - 04-add-surprise-mode.sql
--   - 05-add-build-mode-prompts.sql
--   - 07-add-ideate-review-prompt.sql
--   - 14-add-launch-prompt-columns.sql
--   - 16-add-monetise-prompt-columns.sql
--   - 17-create-stage-settings-table.sql
--   - 18-add-validation-v2-fields.sql
--   - 21-create-idea-improvements-table.sql
--
-- EXCLUDED:
--   - 08-add-ideate-review-user-prompt.sql
-- ============================================================================

-- ============================================================================
-- PART 1: BASE SETUP (from 20-setup-staging-database.sql)
-- ============================================================================

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

-- 5. Create validated_ideas table (depends on project_stages)
CREATE TABLE IF NOT EXISTS public.validated_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  pillar_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_overview JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(project_id),
  UNIQUE(idea_id)
);

CREATE INDEX IF NOT EXISTS validated_ideas_user_id_idx
  ON public.validated_ideas(user_id);

CREATE INDEX IF NOT EXISTS validated_ideas_project_id_idx
  ON public.validated_ideas(project_id);

ALTER TABLE public.validated_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can insert their validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can update their validated ideas" ON public.validated_ideas;
DROP POLICY IF EXISTS "Users can delete their validated ideas" ON public.validated_ideas;

CREATE POLICY "Users can read their validated ideas"
  ON public.validated_ideas FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

CREATE POLICY "Users can insert their validated ideas"
  ON public.validated_ideas FOR INSERT
  WITH CHECK (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

CREATE POLICY "Users can update their validated ideas"
  ON public.validated_ideas FOR UPDATE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

CREATE POLICY "Users can delete their validated ideas"
  ON public.validated_ideas FOR DELETE
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text
  );

CREATE OR REPLACE FUNCTION update_validated_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS validated_ideas_set_updated_at ON public.validated_ideas;
CREATE TRIGGER validated_ideas_set_updated_at
  BEFORE UPDATE ON public.validated_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_validated_ideas_updated_at();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_validation_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS validation_reports_updated_at ON public.validation_reports;
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

-- ============================================================================
-- PART 2: ADD IDEATE PROMPT COLUMNS (from 02-add-ideate-prompt-columns.sql)
-- ============================================================================

-- Add mode-specific prompt template columns for ideate stage
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS user_prompt_template_idea TEXT,
ADD COLUMN IF NOT EXISTS user_prompt_template_problem TEXT;

-- Update the existing ideate row to have the new columns if it exists
UPDATE public.ai_configs
SET 
  user_prompt_template_problem = 'You are helping to ideate solutions to a specific problem. Generate 3 completely different startup ideas that solve this problem: ${input}. Consider any constraints: ${constraints}. If target market is provided (${market}), tailor ideas to that market. If not provided, suggest the most relevant target market(s) for each idea. Format: name, brief, detailed description with key features, target market, unique value proposition.',
  user_prompt_template_idea = 'You are helping to explore and develop an idea. Generate 3 completely different directions to develop and position this idea: ${input}. Consider any constraints: ${constraints}. If target market is provided (${market}), tailor ideas to that market. If not provided, suggest the most relevant target market(s) for each idea. Format: name, brief, detailed description with key features, target market, unique value proposition.'
WHERE stage = 'ideate' AND (user_prompt_template_idea IS NULL OR user_prompt_template_problem IS NULL);

-- Add comment to document the columns
COMMENT ON COLUMN public.ai_configs.user_prompt_template_idea IS 'Prompt template used when Ideate mode is "Idea to Explore"';
COMMENT ON COLUMN public.ai_configs.user_prompt_template_problem IS 'Prompt template used when Ideate mode is "Problem to Solve"';

-- ============================================================================
-- PART 3: ADD IDEATE SYSTEM PROMPTS (from 03-add-ideate-system-prompts.sql)
-- ============================================================================

-- Add mode-specific system prompt columns for ideate stage
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_idea TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_problem TEXT;

-- Update the existing ideate row to have the new columns with default values if it exists
UPDATE public.ai_configs
SET 
  system_prompt_problem = 'You are an expert startup ideation coach specializing in problem-solving. Generate exactly 3 different startup ideas that address the specific problem presented. Each idea should offer a unique approach to solving the problem. Focus on innovative solutions with clear value propositions. Format your response as:

1. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]

2. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]

3. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]',
  system_prompt_idea = 'You are an expert AI startup strategist and SaaS naming consultant. Help entrepreneurs explore and develop their raw business ideas into compelling startup concepts. Generate exactly 3 different directions to develop and position the given idea. Each direction should represent a unique market positioning, business model, or feature focus. Format your response as:

1. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]

2. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]

3. [Idea Name] - [Brief description]
[Detailed description with key features, target market, and unique value proposition]'
WHERE stage = 'ideate' AND (system_prompt_idea IS NULL OR system_prompt_problem IS NULL);

-- Add comments to document the columns
COMMENT ON COLUMN public.ai_configs.system_prompt_idea IS 'System prompt used when Ideate mode is "Idea to Explore"';
COMMENT ON COLUMN public.ai_configs.system_prompt_problem IS 'System prompt used when Ideate mode is "Problem to Solve"';

-- ============================================================================
-- PART 4: ADD SURPRISE MODE (from 04-add-surprise-mode.sql)
-- ============================================================================

-- Add "Surprise Me" mode system prompt column for ideate stage
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_surprise TEXT;

-- Update the existing ideate row with a default surprise mode prompt
UPDATE public.ai_configs
SET 
  system_prompt_surprise = 'You are a visionary startup ideation expert and trend analyst. Generate 3 innovative, exciting startup ideas that blend current technological trends with untapped market opportunities. Focus on ideas that are:

1. Forward-thinking and trend-aware (AI, Web3, sustainability, remote work, etc.)
2. Address real market gaps or emerging needs
3. Commercially viable and scalable
4. Diverse across different industries and business models

Format your response as:

1. [Compelling Startup Name] - [Catchy tagline]
[Detailed description with key features, target market, unique value proposition, and why this is timely/relevant now]

2. [Compelling Startup Name] - [Catchy tagline]
[Detailed description with key features, target market, unique value proposition, and why this is timely/relevant now]

3. [Compelling Startup Name] - [Catchy tagline]
[Detailed description with key features, target market, unique value proposition, and why this is timely/relevant now]

Make each idea feel exciting and inspire the founder to build it!'
WHERE stage = 'ideate' AND system_prompt_surprise IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.ai_configs.system_prompt_surprise IS 'System prompt used when Ideate mode is "Surprise Me"';

-- ============================================================================
-- PART 5: ADD BUILD MODE PROMPTS (from 05-add-build-mode-prompts.sql)
-- ============================================================================

-- Add mode-specific system prompts for Build stage
ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_vibe_coder TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_send_to_devs TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN ai_configs.system_prompt_vibe_coder IS 'System prompt used when build mode is "Vibe Coder (Build it yourself with AI)" - focuses on AI-assisted development workflow';
COMMENT ON COLUMN ai_configs.system_prompt_send_to_devs IS 'System prompt used when build mode is "Send to Developers (Create PRD)" - focuses on formal PRD creation for external teams';

-- ============================================================================
-- PART 6: ADD IDEATE REVIEW PROMPT (from 07-add-ideate-review-prompt.sql)
-- ============================================================================

-- Add review system prompt column for ideate stage
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_review TEXT;

-- Update the existing ideate row with a default review prompt if it exists
UPDATE public.ai_configs
SET 
  system_prompt_review = 'You are an expert startup advisor and AI consultant with 15+ years of experience evaluating startup ideas. Your role is to provide a comprehensive, honest, and actionable review of startup ideas.

Provide your review in the following structured format using markdown:

## Overall Assessment
Start with a brief summary of the idea and your initial impression. Reference specific details from the user''s input.

## What I Noticed in Your Description
- **Target Audience**: Identify who the user mentioned or who should be targeted
- **Problem Indicators**: Note specific problems or pain points mentioned
- **Solution Approach**: Identify how the user is thinking about solving this
- **Technology Stack**: Mention any tech discussed (AI, platform, app, etc.)
- **Market Context**: Note any market or industry mentions

## Strengths I''ve Identified
List 3-5 specific strengths based on what the user actually wrote. Be specific and reference their input.

## Critical Questions to Answer
1. **Market Size**: What''s the total addressable market? Be specific.
2. **Willingness to Pay**: Will people pay for this? Reference their budget if provided.
3. **Competitive Differentiation**: What makes this different? What''s the unique angle?
4. **Execution Feasibility**: Can this realistically be built? Reference their timeline if provided.

## Recommendations Tailored to Your Input
Provide 3-4 specific recommendations based on:
- Their mode (explore idea vs solve problem vs surprise me)
- Their input length and detail level
- Their budget and timeline constraints
- The specific market/industry they mentioned

## Market-Specific Insights
- Sector Analysis: If they mentioned a market (Healthcare, Fintech, etc.), provide specific insights
- Geographic Considerations: If they mentioned a country, provide market-specific advice
- Budget Considerations: If they provided a budget, give realistic expectations
- Timeline Reality Check: If they provided a timeline, assess if it''s realistic

## Next Steps Prioritized
Provide a week-by-week or month-by-month action plan based on their timeline.

## Final Assessment
- Overall Recommendation: Clear recommendation based on their specific input
- Risk Assessment: Specific risks based on their idea and constraints
- Success Probability: Realistic percentage based on what they''ve provided

Be specific, reference their actual words, and provide actionable advice. Don''t be generic - tailor everything to their specific input.'
WHERE stage = 'ideate' AND system_prompt_review IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.ai_configs.system_prompt_review IS 'System prompt used for Ideate review endpoint when users finish the ideate wizard';

-- ============================================================================
-- PART 7: ADD LAUNCH PROMPT COLUMNS (from 14-add-launch-prompt-columns.sql)
-- ============================================================================

-- Add Launch-specific system prompts for Launch stage
ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_launch_overview TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_strategy TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_messaging TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_landing TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_adopters TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_assets TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_metrics TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_launch_pack TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN ai_configs.system_prompt_launch_overview IS 'System prompt for Launch Overview section - helps choose launch path';
COMMENT ON COLUMN ai_configs.system_prompt_launch_strategy IS 'System prompt for Launch Strategy section - generates launch timeline and milestones';
COMMENT ON COLUMN ai_configs.system_prompt_launch_messaging IS 'System prompt for Messaging & Positioning section - creates messaging framework';
COMMENT ON COLUMN ai_configs.system_prompt_launch_landing IS 'System prompt for Landing Page & Onboarding section - generates landing page and email content';
COMMENT ON COLUMN ai_configs.system_prompt_launch_adopters IS 'System prompt for Early Adopters section - identifies personas and outreach plan';
COMMENT ON COLUMN ai_configs.system_prompt_launch_assets IS 'System prompt for Marketing Assets section - generates platform-specific content';
COMMENT ON COLUMN ai_configs.system_prompt_launch_metrics IS 'System prompt for Tracking & Metrics section - creates metrics and tracking plan';
COMMENT ON COLUMN ai_configs.system_prompt_launch_pack IS 'System prompt for Launch Pack section - compiles all launch materials';

-- ============================================================================
-- PART 8: ADD MONETISE PROMPT COLUMNS (from 16-add-monetise-prompt-columns.sql)
-- ============================================================================

-- Add Monetise-specific system prompts for Monetise stage
ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_monetise_overview TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_pricing TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_offer TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_checkout TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_activation TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_assets TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_monetise_pack TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN ai_configs.system_prompt_monetise_overview IS 'System prompt for Monetise Overview section - helps choose monetisation model';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_pricing IS 'System prompt for Pricing Strategy section - generates pricing recommendations';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_offer IS 'System prompt for Offer & Plan Builder section - creates pricing tiers and offers';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_checkout IS 'System prompt for Checkout & Payment Flow section - generates checkout flow and payment setup';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_activation IS 'System prompt for Activation & Onboarding Optimisation section - creates activation funnel and messaging';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_assets IS 'System prompt for Monetisation Assets section - generates sales copy, emails, and promotional content';
COMMENT ON COLUMN ai_configs.system_prompt_monetise_pack IS 'System prompt for Revenue Pack section - compiles all monetisation materials';

-- ============================================================================
-- PART 9: CREATE STAGE SETTINGS TABLE (from 17-create-stage-settings-table.sql)
-- ============================================================================

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

-- ============================================================================
-- PART 10: ADD VALIDATION V2 FIELDS (from 18-add-validation-v2-fields.sql)
-- ============================================================================

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

-- ============================================================================
-- PART 11: CREATE IDEA IMPROVEMENTS TABLE (from 21-create-idea-improvements-table.sql)
-- ============================================================================

-- Create table to store AI idea refinements
CREATE TABLE IF NOT EXISTS public.idea_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  pillar_improved text NOT NULL,
  before_text text,
  after_text text,
  score_delta int,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_idea_improvements_project ON public.idea_improvements(project_id);

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MASTER SETUP COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All database tables and columns have been created successfully.';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Script 08 (add-ideate-review-user-prompt) was EXCLUDED as requested.';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

