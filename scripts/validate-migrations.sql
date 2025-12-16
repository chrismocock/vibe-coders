-- ============================================================================
-- SQL Migration Validation Script
-- ============================================================================
-- This script checks if all 21 migration scripts have been applied to your
-- Supabase database. Run this in the Supabase SQL Editor to see which
-- migrations are applied and which are missing.
--
-- IMPORTANT: After running, check ALL result tabs at the bottom:
--   - Tab 1: MISSING MIGRATIONS (shows which script files to run)
--   - Tab 2: SUMMARY STATISTICS (shows counts)
--   - Tab 3: ALL MIGRATIONS (complete list)
-- ============================================================================

-- Create a temporary table to store validation results
CREATE TEMP TABLE IF NOT EXISTS migration_validation (
    script_number TEXT,
    script_name TEXT,
    script_filename TEXT,
    status TEXT,
    details TEXT
);

-- Clear any existing results
TRUNCATE TABLE migration_validation;

DO $$
DECLARE
    migration_status RECORD;
    total_migrations INTEGER := 21;
    applied_count INTEGER := 0;
    missing_count INTEGER := 0;
BEGIN

    -- ========================================================================
    -- Migration 01: Create ai_configs table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_configs'
    ) THEN
        INSERT INTO migration_validation VALUES ('01', 'create-ai-configs-table', '01-create-ai-configs-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('01', 'create-ai-configs-table', '01-create-ai-configs-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 02: Add ideate prompt columns
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'user_prompt_template_idea'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'user_prompt_template_problem'
    ) THEN
        INSERT INTO migration_validation VALUES ('02', 'add-ideate-prompt-columns', '02-add-ideate-prompt-columns.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('02', 'add-ideate-prompt-columns', '02-add-ideate-prompt-columns.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 03: Add ideate system prompts
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_idea'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_problem'
    ) THEN
        INSERT INTO migration_validation VALUES ('03', 'add-ideate-system-prompts', '03-add-ideate-system-prompts.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('03', 'add-ideate-system-prompts', '03-add-ideate-system-prompts.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 04: Add surprise mode
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_surprise'
    ) THEN
        INSERT INTO migration_validation VALUES ('04', 'add-surprise-mode', '04-add-surprise-mode.sql', '✅ APPLIED', 'Column exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('04', 'add-surprise-mode', '04-add-surprise-mode.sql', '❌ MISSING', 'Column missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 05: Add build mode prompts
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_vibe_coder'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_send_to_devs'
    ) THEN
        INSERT INTO migration_validation VALUES ('05', 'add-build-mode-prompts', '05-add-build-mode-prompts.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('05', 'add-build-mode-prompts', '05-add-build-mode-prompts.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 06: Create validation_reports table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'validation_reports'
    ) THEN
        INSERT INTO migration_validation VALUES ('06', 'create-validation-reports-table', '06-create-validation-reports-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('06', 'create-validation-reports-table', '06-create-validation-reports-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 07: Add ideate review prompt
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_review'
    ) THEN
        INSERT INTO migration_validation VALUES ('07', 'add-ideate-review-prompt', '07-add-ideate-review-prompt.sql', '✅ APPLIED', 'Column exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('07', 'add-ideate-review-prompt', '07-add-ideate-review-prompt.sql', '❌ MISSING', 'Column missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 08: Add ideate review user prompt
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'user_prompt_template_review'
    ) THEN
        INSERT INTO migration_validation VALUES ('08', 'add-ideate-review-user-prompt', '08-add-ideate-review-user-prompt.sql', '✅ APPLIED', 'Column exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('08', 'add-ideate-review-user-prompt', '08-add-ideate-review-user-prompt.sql', '❌ MISSING', 'Column missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 09: Add section results column
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'validation_reports' 
        AND column_name = 'section_results'
    ) THEN
        INSERT INTO migration_validation VALUES ('09', 'add-section-results-column', '09-add-section-results-column.sql', '✅ APPLIED', 'Column exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('09', 'add-section-results-column', '09-add-section-results-column.sql', '❌ MISSING', 'Column missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 10: Add completed actions column
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'validation_reports' 
        AND column_name = 'completed_actions'
    ) THEN
        INSERT INTO migration_validation VALUES ('10', 'add-completed-actions-column', '10-add-completed-actions-column.sql', '✅ APPLIED', 'Column exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('10', 'add-completed-actions-column', '10-add-completed-actions-column.sql', '❌ MISSING', 'Column missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 11: Create design_blueprints table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'design_blueprints'
    ) THEN
        INSERT INTO migration_validation VALUES ('11', 'create-design-blueprints-table', '11-create-design-blueprints-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('11', 'create-design-blueprints-table', '11-create-design-blueprints-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 12: Create build_blueprints table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'build_blueprints'
    ) THEN
        INSERT INTO migration_validation VALUES ('12', 'create-build-blueprints-table', '12-create-build-blueprints-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('12', 'create-build-blueprints-table', '12-create-build-blueprints-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 13: Create launch_blueprints table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'launch_blueprints'
    ) THEN
        INSERT INTO migration_validation VALUES ('13', 'create-launch-blueprints-table', '13-create-launch-blueprints-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('13', 'create-launch-blueprints-table', '13-create-launch-blueprints-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 14: Add launch prompt columns
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_launch_overview'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_launch_pack'
    ) THEN
        INSERT INTO migration_validation VALUES ('14', 'add-launch-prompt-columns', '14-add-launch-prompt-columns.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('14', 'add-launch-prompt-columns', '14-add-launch-prompt-columns.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 15: Create monetise_blueprints table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'monetise_blueprints'
    ) THEN
        INSERT INTO migration_validation VALUES ('15', 'create-monetise-blueprints-table', '15-create-monetise-blueprints-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('15', 'create-monetise-blueprints-table', '15-create-monetise-blueprints-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 16: Add monetise prompt columns
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_monetise_overview'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs' 
        AND column_name = 'system_prompt_monetise_pack'
    ) THEN
        INSERT INTO migration_validation VALUES ('16', 'add-monetise-prompt-columns', '16-add-monetise-prompt-columns.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('16', 'add-monetise-prompt-columns', '16-add-monetise-prompt-columns.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 17: Create stage_settings table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stage_settings'
    ) THEN
        INSERT INTO migration_validation VALUES ('17', 'create-stage-settings-table', '17-create-stage-settings-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('17', 'create-stage-settings-table', '17-create-stage-settings-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 18: Add validation v2 fields
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'validation_reports' 
        AND column_name = 'opportunity_score'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'validation_reports' 
        AND column_name = 'risk_radar'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'validation_reports' 
        AND column_name = 'analysis_feed'
    ) THEN
        INSERT INTO migration_validation VALUES ('18', 'add-validation-v2-fields', '18-add-validation-v2-fields.sql', '✅ APPLIED', 'Columns exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('18', 'add-validation-v2-fields', '18-add-validation-v2-fields.sql', '❌ MISSING', 'Columns missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 19: Create validated_ideas table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'validated_ideas'
    ) THEN
        INSERT INTO migration_validation VALUES ('19', 'create-validated-ideas-table', '19-create-validated-ideas-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('19', 'create-validated-ideas-table', '19-create-validated-ideas-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 20: Setup staging database (core tables)
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'project_stages'
    ) THEN
        INSERT INTO migration_validation VALUES ('20', 'setup-staging-database', '20-setup-staging-database.sql', '✅ APPLIED', 'Core tables exist');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('20', 'setup-staging-database', '20-setup-staging-database.sql', '❌ MISSING', 'Core tables missing');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Migration 21: Create idea_improvements table
    -- ========================================================================
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'idea_improvements'
    ) THEN
        INSERT INTO migration_validation VALUES ('21', 'create-idea-improvements-table', '21-create-idea-improvements-table.sql', '✅ APPLIED', 'Table exists');
        applied_count := applied_count + 1;
    ELSE
        INSERT INTO migration_validation VALUES ('21', 'create-idea-improvements-table', '21-create-idea-improvements-table.sql', '❌ MISSING', 'Table does not exist');
        missing_count := missing_count + 1;
    END IF;

    -- ========================================================================
    -- Display Results
    -- ========================================================================
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION VALIDATION REPORT';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    
    FOR migration_status IN 
        SELECT * FROM migration_validation ORDER BY script_number
    LOOP
        RAISE NOTICE '% | % | % | %', 
            RPAD(migration_status.script_number, 3),
            RPAD(migration_status.status, 12),
            RPAD(migration_status.script_name, 35),
            migration_status.details;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUMMARY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Total Migrations: %', total_migrations;
    RAISE NOTICE '✅ Applied: %', applied_count;
    RAISE NOTICE '❌ Missing: %', missing_count;
    RAISE NOTICE '';
    
    IF missing_count = 0 THEN
        RAISE NOTICE '🎉 All migrations have been applied successfully!';
    ELSE
        RAISE NOTICE '⚠️  Some migrations are missing. Please run the missing migration scripts.';
        RAISE NOTICE '';
        RAISE NOTICE 'Missing migrations:';
        FOR migration_status IN 
            SELECT * FROM migration_validation 
            WHERE status = '❌ MISSING' 
            ORDER BY script_number
        LOOP
            RAISE NOTICE '  - %: % (file: %)', migration_status.script_number, migration_status.script_name, migration_status.script_filename;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';

END $$;

-- ============================================================================
-- PRIMARY RESULT: Missing Migrations + Summary (Check this first!)
-- ============================================================================
-- This shows missing migrations at the top, then a summary row
SELECT 
    "Script #",
    "Script File to Run",
    "Migration Name",
    "What's Missing"
FROM (
    SELECT 
        script_number AS "Script #",
        script_filename AS "Script File to Run",
        script_name AS "Migration Name",
        details AS "What's Missing",
        0 AS sort_order
    FROM migration_validation
    WHERE status = '❌ MISSING'

    UNION ALL

    -- Add summary row at the bottom
    SELECT 
        '---' AS "Script #",
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = '❌ MISSING') = 0 
            THEN '✅ All migrations applied!'
            ELSE '⚠️  ' || COUNT(*) FILTER (WHERE status = '❌ MISSING')::TEXT || ' migration(s) missing'
        END AS "Script File to Run",
        'SUMMARY' AS "Migration Name",
        'Applied: ' || COUNT(*) FILTER (WHERE status = '✅ APPLIED')::TEXT || 
        ' | Missing: ' || COUNT(*) FILTER (WHERE status = '❌ MISSING')::TEXT ||
        ' | Total: ' || COUNT(*)::TEXT AS "What's Missing",
        1 AS sort_order
    FROM migration_validation
) combined_results
ORDER BY sort_order, "Script #";

-- ============================================================================
-- COMPLETE LIST: All Migrations (Full Details)
-- ============================================================================
SELECT 
    script_number AS "Script",
    status AS "Status",
    script_name AS "Migration Name",
    script_filename AS "Script File",
    details AS "Details"
FROM migration_validation
ORDER BY script_number;

