-- Add mode-specific system prompts for Build stage
-- Run this in your Supabase SQL editor

ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS system_prompt_vibe_coder TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_send_to_devs TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN ai_configs.system_prompt_vibe_coder IS 'System prompt used when build mode is "Vibe Coder (Build it yourself with AI)" - focuses on AI-assisted development workflow';
COMMENT ON COLUMN ai_configs.system_prompt_send_to_devs IS 'System prompt used when build mode is "Send to Developers (Create PRD)" - focuses on formal PRD creation for external teams';

