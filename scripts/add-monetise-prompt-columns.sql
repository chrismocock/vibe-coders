-- Add Monetise-specific system prompts for Monetise stage
-- Run this in your Supabase SQL editor

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

