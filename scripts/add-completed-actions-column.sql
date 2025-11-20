-- Add completed_actions JSONB column to validation_reports table
ALTER TABLE validation_reports 
ADD COLUMN IF NOT EXISTS completed_actions JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS validation_reports_completed_actions_idx 
ON validation_reports USING GIN (completed_actions);

