-- Add Launch-specific system prompts for Launch stage
-- Run this in your Supabase SQL editor

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

