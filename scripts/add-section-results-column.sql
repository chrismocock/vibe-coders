-- Add section_results JSONB column to validation_reports table
ALTER TABLE validation_reports 
ADD COLUMN IF NOT EXISTS section_results JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS validation_reports_section_results_idx 
ON validation_reports USING GIN (section_results);

