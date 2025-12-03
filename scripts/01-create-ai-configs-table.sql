-- Create ai_configs table for AI configuration management
CREATE TABLE IF NOT EXISTS public.ai_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on stage for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_configs_stage ON public.ai_configs(stage);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.ai_configs TO authenticated;
-- GRANT ALL ON public.ai_configs TO service_role;
