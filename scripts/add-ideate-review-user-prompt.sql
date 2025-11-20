-- Add review user prompt template column for ideate stage
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS user_prompt_template_review TEXT;

-- Update the existing ideate row with a default review user prompt template if it exists
UPDATE public.ai_configs
SET 
  user_prompt_template_review = 'Please provide a comprehensive AI review for this startup idea:

${ideaContext}${additionalContext}

Analyze this thoroughly and provide specific, actionable feedback. Reference their actual input and be specific rather than generic.'
WHERE stage = 'ideate' AND user_prompt_template_review IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.ai_configs.user_prompt_template_review IS 'User prompt template used for Ideate review endpoint when users finish the ideate wizard. Variables: ${mode}, ${ideaContext}, ${additionalContext}';

