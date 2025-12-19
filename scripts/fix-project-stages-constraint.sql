-- ============================================================================
-- FIX SCRIPT: Add Missing Foreign Key Constraint to project_stages
-- ============================================================================
-- This script fixes the foreign key constraint issue by ensuring the
-- constraint exists on project_stages.project_id referencing projects.id
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if constraint already exists
-- ============================================================================
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'project_stages'
          AND constraint_name = 'project_stages_project_id_fkey'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Foreign key constraint already exists. No action needed.';
    ELSE
        RAISE NOTICE 'Foreign key constraint is missing. Adding it now...';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop existing constraint if it exists (with different name)
-- ============================================================================
-- First, find and drop any existing foreign key constraint on project_id
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find any foreign key constraint on project_id column
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'project_stages'
        AND kcu.column_name = 'project_id'
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.project_stages DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped existing constraint: %', constraint_name;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify projects table exists and has id column
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) THEN
        RAISE EXCEPTION 'Projects table does not exist! Create it first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Projects table does not have an id column!';
    END IF;
    
    RAISE NOTICE 'Projects table exists and has id column. Proceeding...';
END $$;

-- ============================================================================
-- STEP 4: Verify project_stages table exists and has project_id column
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'project_stages'
    ) THEN
        RAISE EXCEPTION 'Project_stages table does not exist! Create it first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'project_stages'
          AND column_name = 'project_id'
    ) THEN
        RAISE EXCEPTION 'Project_stages table does not have a project_id column!';
    END IF;
    
    RAISE NOTICE 'Project_stages table exists and has project_id column. Proceeding...';
END $$;

-- ============================================================================
-- STEP 5: Add the foreign key constraint
-- ============================================================================
-- Only add if it doesn't already exist
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'project_stages'
          AND constraint_name = 'project_stages_project_id_fkey'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE public.project_stages
        ADD CONSTRAINT project_stages_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES public.projects(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key constraint added successfully!';
    ELSE
        RAISE NOTICE 'Constraint already exists. No action needed.';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Verify the constraint was created
-- ============================================================================
SELECT 
    'VERIFICATION: Constraint Status' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'project_stages'
              AND constraint_name = 'project_stages_project_id_fkey'
        ) THEN '✅ CONSTRAINT EXISTS'
        ELSE '❌ CONSTRAINT STILL MISSING'
    END AS status,
    'Foreign key: project_stages.project_id -> projects.id' AS details;

-- ============================================================================
-- STEP 7: Show constraint details
-- ============================================================================
SELECT 
    'Constraint Details' AS info_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.constraint_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'project_stages'
    AND kcu.column_name = 'project_id';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'FIX COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The foreign key constraint should now be in place.';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still see errors, check:';
    RAISE NOTICE '  1. The projects table exists and has data';
    RAISE NOTICE '  2. The project_id being inserted actually exists in projects table';
    RAISE NOTICE '  3. RLS policies are not blocking the insert';
    RAISE NOTICE '';
    RAISE NOTICE 'Run the diagnostic script again to verify:';
    RAISE NOTICE '  scripts/diagnose-foreign-key-issue.sql';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;



