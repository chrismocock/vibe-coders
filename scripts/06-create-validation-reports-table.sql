-- Create validation_reports table for AI validation results
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

-- Create index on project_id and created_at for faster lookups
CREATE INDEX IF NOT EXISTS validation_reports_project_created_idx
  ON public.validation_reports(project_id, created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS validation_reports_status_idx
  ON public.validation_reports(status);

-- Enable RLS
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read validation reports for their own projects
-- Note: This assumes projects.user_id exists and matches Clerk userId
-- Since we're using Clerk auth, we'll rely on API-level checks primarily
-- This policy provides defense in depth
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

