-- ============================================================================
-- TEST SERVICE ROLE BYPASS FOR FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This script tests if the issue is related to RLS policies by checking
-- what happens when using service_role (which should bypass RLS)
-- ============================================================================

-- ============================================================================
-- NOTE: This script should be run with service_role privileges
-- ============================================================================

-- ============================================================================
-- TEST 1: Check current role
-- ============================================================================
SELECT 
    'TEST 1: Current Role' AS test_name,
    current_user AS current_role,
    current_setting('role') AS session_role,
    CASE 
        WHEN current_user = 'service_role' OR current_setting('role') = 'service_role' THEN '✅ Running as service_role'
        ELSE '⚠️  Not running as service_role - RLS will apply'
    END AS status;

-- ============================================================================
-- TEST 2: Check if service_role policy exists
-- ============================================================================
SELECT 
    'TEST 2: Service Role Policy Check' AS test_name,
    policyname,
    cmd,
    qual AS using_clause,
    with_check AS with_check_clause,
    CASE 
        WHEN qual LIKE '%service_role%' OR with_check LIKE '%service_role%' THEN '✅ Service role policy found'
        ELSE '❌ No service role policy'
    END AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
    AND (qual LIKE '%service_role%' OR with_check LIKE '%service_role%' OR cmd = 'ALL');

-- ============================================================================
-- TEST 3: Try to insert with current role (simulating API call)
-- ============================================================================
DO $$
DECLARE
    test_project_id UUID;
    test_user_id TEXT;
    insert_success BOOLEAN := false;
    error_message TEXT;
BEGIN
    -- Get a real project to test with
    SELECT id, user_id INTO test_project_id, test_user_id
    FROM public.projects 
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'TEST 3: No projects found. Creating a test project first...';
        
        -- Create a test project
        INSERT INTO public.projects (title, user_id, description)
        VALUES ('Test Project for RLS Test', 'test-user-rls', 'Test')
        RETURNING id, user_id INTO test_project_id, test_user_id;
        
        RAISE NOTICE 'Created test project: %', test_project_id;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 3: Attempting insert with current role...';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Current Role: %', current_user;
    RAISE NOTICE '';
    
    BEGIN
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
            'Test input for RLS bypass test',
            'pending'
        );
        
        RAISE NOTICE '✅ INSERT SUCCEEDED!';
        RAISE NOTICE '   The foreign key constraint works with current role.';
        
        insert_success := true;
        
        -- Clean up test stage
        DELETE FROM public.project_stages 
        WHERE project_id = test_project_id 
          AND stage = 'ideate' 
          AND input = 'Test input for RLS bypass test';
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            error_message := SQLERRM;
            RAISE NOTICE '❌ FOREIGN KEY CONSTRAINT VIOLATION';
            RAISE NOTICE '   Error: %', error_message;
            RAISE NOTICE '';
            RAISE NOTICE '   This suggests:';
            RAISE NOTICE '   1. The project_id does not exist in projects table';
            RAISE NOTICE '   2. Or RLS is blocking the foreign key check';
            RAISE NOTICE '   3. Or there is a UUID format mismatch';
            
        WHEN insufficient_privilege THEN
            error_message := SQLERRM;
            RAISE NOTICE '❌ INSUFFICIENT PRIVILEGE';
            RAISE NOTICE '   Error: %', error_message;
            RAISE NOTICE '';
            RAISE NOTICE '   This suggests RLS policies are blocking the insert.';
            RAISE NOTICE '   Try running with service_role or check RLS policies.';
            
        WHEN OTHERS THEN
            error_message := SQLERRM;
            RAISE NOTICE '❌ OTHER ERROR';
            RAISE NOTICE '   Error: %', error_message;
            RAISE NOTICE '   Error Code: %', SQLSTATE;
    END;
    
    -- If we created a test project and the insert failed, clean it up
    IF NOT insert_success AND test_user_id = 'test-user-rls' THEN
        DELETE FROM public.projects WHERE id = test_project_id;
        RAISE NOTICE '';
        RAISE NOTICE 'Cleaned up test project.';
    END IF;
    
END $$;

-- ============================================================================
-- TEST 4: Check RLS policies that might interfere
-- ============================================================================
SELECT 
    'TEST 4: All RLS Policies on project_stages' AS test_name,
    policyname,
    cmd,
    permissive,
    roles,
    CASE 
        WHEN cmd = 'ALL' THEN '✅ Covers all operations'
        WHEN cmd = 'INSERT' THEN '✅ Covers INSERT'
        ELSE '⚠️  Other operation'
    END AS coverage,
    CASE 
        WHEN qual IS NULL AND with_check IS NULL THEN '⚠️  No restrictions (allows all)'
        WHEN qual LIKE '%service_role%' OR with_check LIKE '%service_role%' THEN '✅ Has service_role bypass'
        WHEN qual LIKE '%user_id%' THEN '✅ Checks user_id'
        ELSE '⚠️  Custom check'
    END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
ORDER BY cmd, policyname;

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================
DO $$
DECLARE
    current_role_name TEXT;
    has_service_policy BOOLEAN;
BEGIN
    current_role_name := current_user;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_stages'
          AND (qual LIKE '%service_role%' OR with_check LIKE '%service_role%')
    ) INTO has_service_policy;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RECOMMENDATIONS';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Current Role: %', current_role_name;
    RAISE NOTICE '';
    
    IF current_role_name != 'service_role' AND NOT has_service_policy THEN
        RAISE NOTICE '⚠️  IMPORTANT:';
        RAISE NOTICE '   - You are not running as service_role';
        RAISE NOTICE '   - No service_role bypass policy found';
        RAISE NOTICE '   - RLS policies will apply to all inserts';
        RAISE NOTICE '';
        RAISE NOTICE '   If your API uses service_role, make sure:';
        RAISE NOTICE '   1. The service_role bypass policy exists';
        RAISE NOTICE '   2. The API is actually using service_role credentials';
        RAISE NOTICE '';
    ELSIF current_role_name = 'service_role' THEN
        RAISE NOTICE '✅ Running as service_role - RLS should be bypassed';
        RAISE NOTICE '';
    END IF;
    
    RAISE NOTICE 'If foreign key errors persist even with service_role:';
    RAISE NOTICE '  1. Verify the project_id actually exists in projects table';
    RAISE NOTICE '  2. Check UUID format matches (no string vs UUID issues)';
    RAISE NOTICE '  3. Ensure projects table has RLS policies that allow reads';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;


