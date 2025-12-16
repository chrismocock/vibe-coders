-- ============================================================================
-- WIPE DATABASE SCRIPT - DESTRUCTIVE OPERATION
-- ============================================================================
-- ⚠️  WARNING: This script will DELETE ALL DATA and DROP ALL TABLES
-- ⚠️  This action CANNOT be undone!
-- ⚠️  Only run this if you want to completely reset your database
-- ============================================================================
-- 
-- This script will:
-- 1. Drop all application tables (in correct order to handle foreign keys)
-- 2. Drop all functions and triggers
-- 3. Clean up any remaining objects
--
-- After running this, you can start fresh by running:
--   1. scripts/20-setup-staging-database.sql
--   2. Then the remaining migration scripts (02-05, 07-08, 14, 16-18, 21)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all triggers first (before dropping tables)
-- ============================================================================

-- Drop triggers before tables to avoid dependency issues
DO $$
BEGIN
    -- Validation reports triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'validation_reports') THEN
        DROP TRIGGER IF EXISTS validation_reports_updated_at ON public.validation_reports;
    END IF;
    
    -- Validated ideas triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'validated_ideas') THEN
        DROP TRIGGER IF EXISTS validated_ideas_set_updated_at ON public.validated_ideas;
    END IF;
    
    -- Design blueprints triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'design_blueprints') THEN
        DROP TRIGGER IF EXISTS design_blueprints_updated_at ON public.design_blueprints;
    END IF;
    
    -- Build blueprints triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'build_blueprints') THEN
        DROP TRIGGER IF EXISTS build_blueprints_updated_at ON public.build_blueprints;
    END IF;
    
    -- Launch blueprints triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'launch_blueprints') THEN
        DROP TRIGGER IF EXISTS launch_blueprints_updated_at ON public.launch_blueprints;
    END IF;
    
    -- Monetise blueprints triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monetise_blueprints') THEN
        DROP TRIGGER IF EXISTS monetise_blueprints_updated_at ON public.monetise_blueprints;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop all tables (CASCADE will handle foreign key constraints, triggers, and policies)
-- ============================================================================

-- Drop tables that have foreign key dependencies first, then base tables
-- CASCADE automatically drops: triggers, policies, indexes, and dependent objects
DROP TABLE IF EXISTS public.idea_improvements CASCADE;
DROP TABLE IF EXISTS public.monetise_blueprints CASCADE;
DROP TABLE IF EXISTS public.launch_blueprints CASCADE;
DROP TABLE IF EXISTS public.build_blueprints CASCADE;
DROP TABLE IF EXISTS public.design_blueprints CASCADE;
DROP TABLE IF EXISTS public.validated_ideas CASCADE;
DROP TABLE IF EXISTS public.validation_reports CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.stage_settings CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.ai_configs CASCADE;

-- ============================================================================
-- STEP 3: Drop all functions (if they exist)
-- ============================================================================

DROP FUNCTION IF EXISTS update_validation_reports_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_validated_ideas_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_design_blueprints_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_build_blueprints_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_launch_blueprints_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_monetise_blueprints_updated_at() CASCADE;

-- ============================================================================
-- STEP 5: Verify cleanup (optional - shows what tables remain)
-- ============================================================================

-- This query will show any remaining tables in the public schema
-- (excluding system tables)
SELECT 
    table_name,
    'Still exists - may need manual cleanup' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'DATABASE WIPE COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All application tables, functions, triggers, and policies have been removed.';
    RAISE NOTICE '';
    RAISE NOTICE 'To rebuild the database, run:';
    RAISE NOTICE '  1. scripts/20-setup-staging-database.sql';
    RAISE NOTICE '  2. Then run the remaining migration scripts in order';
    RAISE NOTICE '';
    RAISE NOTICE 'Check the query results above to see if any tables remain.';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

