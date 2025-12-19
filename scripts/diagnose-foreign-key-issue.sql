-- ============================================================================
-- DIAGNOSTIC SCRIPT: Foreign Key Constraint Issue on project_stages
-- ============================================================================
-- This script checks the database schema to diagnose why foreign key
-- constraint violations are occurring when saving project_stages data.
-- ============================================================================

-- ============================================================================
-- CHECK 1: Does projects table exist?
-- ============================================================================
SELECT 
    'CHECK 1: Projects Table' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'projects'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    'Table must exist for foreign key reference' AS note;

-- ============================================================================
-- CHECK 2: Does project_stages table exist?
-- ============================================================================
SELECT 
    'CHECK 2: Project Stages Table' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'project_stages'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    'Table must exist to have foreign key constraint' AS note;

-- ============================================================================
-- CHECK 3: Projects table structure
-- ============================================================================
SELECT 
    'CHECK 3: Projects Table Structure' AS check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK 4: Project_stages table structure
-- ============================================================================
SELECT 
    'CHECK 4: Project Stages Table Structure' AS check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'project_stages'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK 5: List ALL foreign key constraints on project_stages
-- ============================================================================
SELECT 
    'CHECK 5: Foreign Key Constraints' AS check_name,
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
    AND tc.table_name = 'project_stages';

-- ============================================================================
-- CHECK 6: Check if specific constraint exists
-- ============================================================================
SELECT 
    'CHECK 6: Specific Constraint Check' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
              AND table_name = 'project_stages'
              AND constraint_name = 'project_stages_project_id_fkey'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status,
    'Constraint name: project_stages_project_id_fkey' AS note;

-- ============================================================================
-- CHECK 7: Check for any constraint on project_id column
-- ============================================================================
SELECT 
    'CHECK 7: Any Constraint on project_id' AS check_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN '✅ Foreign Key Found'
        WHEN tc.constraint_type = 'NOT NULL' THEN '⚠️  Only NOT NULL constraint'
        ELSE '❌ Unexpected constraint type'
    END AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'project_stages'
    AND kcu.column_name = 'project_id';

-- ============================================================================
-- CHECK 8: RLS Status
-- ============================================================================
SELECT 
    'CHECK 8: RLS Status' AS check_name,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'project_stages');

-- ============================================================================
-- CHECK 9: RLS Policies on project_stages
-- ============================================================================
SELECT 
    'CHECK 9: RLS Policies' AS check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
ORDER BY policyname;

-- ============================================================================
-- CHECK 10: Sample data check (if tables have data)
-- ============================================================================
SELECT 
    'CHECK 10: Sample Data' AS check_name,
    (SELECT COUNT(*) FROM public.projects) AS projects_count,
    (SELECT COUNT(*) FROM public.project_stages) AS project_stages_count,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.project_stages ps
            LEFT JOIN public.projects p ON ps.project_id = p.id
            WHERE p.id IS NULL
        ) THEN '⚠️  Orphaned project_stages rows found'
        ELSE '✅ No orphaned rows'
    END AS data_integrity_status;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'DIAGNOSTIC SUMMARY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the query results above to identify the issue.';
    RAISE NOTICE '';
    RAISE NOTICE 'Common issues:';
    RAISE NOTICE '  - Missing foreign key constraint (CHECK 6 should show ❌ MISSING)';
    RAISE NOTICE '  - Constraint name mismatch';
    RAISE NOTICE '  - Projects table missing or incorrect structure';
    RAISE NOTICE '  - RLS policies blocking inserts';
    RAISE NOTICE '';
    RAISE NOTICE 'If constraint is missing, run: scripts/fix-project-stages-constraint.sql';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;


