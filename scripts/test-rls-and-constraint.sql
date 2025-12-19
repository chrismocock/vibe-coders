-- ============================================================================
-- TEST SCRIPT: RLS and Foreign Key Constraint Interaction
-- ============================================================================
-- This script tests if RLS policies are interfering with foreign key
-- constraint validation when inserting into project_stages
-- ============================================================================

-- ============================================================================
-- TEST 1: Check RLS Policies on project_stages for INSERT
-- ============================================================================
SELECT 
    'TEST 1: RLS INSERT Policies' AS test_name,
    policyname,
    cmd AS command_type,
    permissive,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
    AND cmd IN ('INSERT', 'ALL')
ORDER BY policyname;

-- ============================================================================
-- TEST 2: Check if there's a service_role bypass policy
-- ============================================================================
SELECT 
    'TEST 2: Service Role Policy' AS test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'project_stages'
              AND (qual LIKE '%service_role%' OR with_check LIKE '%service_role%')
        ) THEN '✅ Service role policy exists'
        ELSE '❌ No service role policy found'
    END AS status,
    'Service role policy needed for API inserts' AS note;

-- ============================================================================
-- TEST 3: Verify a test project exists (or create one for testing)
-- ============================================================================
-- First, check if any projects exist
SELECT 
    'TEST 3: Projects Check' AS test_name,
    COUNT(*) AS project_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Projects exist'
        ELSE '⚠️  No projects found - will need to create test project'
    END AS status
FROM public.projects;

-- ============================================================================
-- TEST 4: Check RLS is enabled and policies are active
-- ============================================================================
SELECT 
    'TEST 4: RLS Status' AS test_name,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END AS rls_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = t.tablename) > 0 
        THEN '✅ Has policies'
        ELSE '❌ No policies'
    END AS policies_status
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'project_stages')
ORDER BY tablename;

-- ============================================================================
-- TEST 5: Simulate the insert scenario (dry run - won't actually insert)
-- ============================================================================
-- This shows what would happen if we tried to insert
DO $$
DECLARE
    test_project_id UUID;
    test_user_id TEXT := 'test-user-id';
    constraint_error TEXT;
BEGIN
    -- Get a real project ID if one exists
    SELECT id INTO test_project_id 
    FROM public.projects 
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'TEST 5: No projects found - cannot test insert scenario';
        RAISE NOTICE 'Create a project first, then re-run this test';
    ELSE
        RAISE NOTICE 'TEST 5: Testing insert scenario with project_id: %', test_project_id;
        RAISE NOTICE 'This is a dry run - checking if insert would work...';
        
        -- Try to explain what would happen
        BEGIN
            -- This will fail in a transaction that gets rolled back
            -- but we can catch the error
            INSERT INTO public.project_stages (
                project_id,
                user_id,
                stage,
                input,
                status
            ) VALUES (
                test_project_id,
                test_user_id,
                'ideate',
                'test input',
                'pending'
            );
            
            RAISE NOTICE '✅ Insert would succeed (if RLS allows)';
            
            -- Rollback the test insert
            ROLLBACK;
        EXCEPTION 
            WHEN foreign_key_violation THEN
                RAISE NOTICE '❌ Foreign key constraint violation would occur';
                RAISE NOTICE 'Error: %', SQLERRM;
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Other error: %', SQLERRM;
        END;
    END IF;
END $$;

-- ============================================================================
-- TEST 6: Check RLS policy expressions for potential issues
-- ============================================================================
SELECT 
    'TEST 6: RLS Policy Analysis' AS test_name,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%user_id%' AND qual LIKE '%jwt%' THEN '✅ Uses JWT user_id check'
        WHEN qual LIKE '%service_role%' THEN '✅ Has service_role bypass'
        WHEN qual IS NULL THEN '⚠️  No USING clause (allows all)'
        ELSE '⚠️  Custom expression'
    END AS policy_type,
    qual AS policy_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
    AND cmd IN ('INSERT', 'ALL')
ORDER BY policyname;

-- ============================================================================
-- TEST 7: Verify projects table RLS policies
-- ============================================================================
SELECT 
    'TEST 7: Projects Table RLS' AS test_name,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%user_id%' AND qual LIKE '%jwt%' THEN '✅ Uses JWT user_id check'
        WHEN qual LIKE '%service_role%' THEN '✅ Has service_role bypass'
        ELSE '⚠️  Check expression'
    END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'projects'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY AND RECOMMENDATIONS
-- ============================================================================
DO $$
DECLARE
    has_service_policy BOOLEAN;
    has_user_policy BOOLEAN;
BEGIN
    -- Check for service role policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_stages'
          AND (qual LIKE '%service_role%' OR with_check LIKE '%service_role%')
    ) INTO has_service_policy;
    
    -- Check for user policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_stages'
          AND cmd IN ('INSERT', 'ALL')
          AND (qual LIKE '%user_id%' OR with_check LIKE '%user_id%')
    ) INTO has_user_policy;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RLS POLICY ANALYSIS';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    
    IF NOT has_service_policy THEN
        RAISE NOTICE '⚠️  WARNING: No service_role bypass policy found!';
        RAISE NOTICE '   This could cause issues if API uses service_role.';
        RAISE NOTICE '';
    END IF;
    
    IF NOT has_user_policy THEN
        RAISE NOTICE '⚠️  WARNING: No user_id-based INSERT policy found!';
        RAISE NOTICE '   This could prevent authenticated users from inserting.';
        RAISE NOTICE '';
    END IF;
    
    IF has_service_policy AND has_user_policy THEN
        RAISE NOTICE '✅ Both service_role and user policies exist.';
        RAISE NOTICE '   If errors persist, check:';
        RAISE NOTICE '   1. The project_id actually exists in projects table';
        RAISE NOTICE '   2. The user_id matches between projects and project_stages';
        RAISE NOTICE '   3. RLS is not blocking the foreign key check';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;



