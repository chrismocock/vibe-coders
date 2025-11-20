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

