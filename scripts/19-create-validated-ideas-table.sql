-- Creates validated_ideas table used by the simplified Validation stage
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

DROP TRIGGER IF EXISTS validated_ideas_set_updated_at ON public.validated_ideas;
CREATE TRIGGER validated_ideas_set_updated_at
  BEFORE UPDATE ON public.validated_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_validated_ideas_updated_at();


