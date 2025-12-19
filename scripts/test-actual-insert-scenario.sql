-- ============================================================================
-- TEST ACTUAL INSERT SCENARIO
-- ============================================================================
-- This script tests the exact scenario that's failing in your application
-- ============================================================================

-- ============================================================================
-- STEP 1: Get the actual project from your database
-- ============================================================================
SELECT 
    'STEP 1: Project Details' AS step,
    id AS project_id,
    title,
    user_id,
    created_at
FROM public.projects
WHERE id = '799a46e2-4a97-4275-8988-b6d277de8708'
   OR title = 'test external'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- STEP 2: Check if project_stages already has an ideate stage for this project
-- ============================================================================
SELECT 
    'STEP 2: Existing Stages' AS step,
    id AS stage_id,
    project_id,
    stage,
    status,
    user_id,
    created_at
FROM public.project_stages
WHERE project_id = (
    SELECT id FROM public.projects 
    WHERE id = '799a46e2-4a97-4275-8988-b6d277de8708'
       OR title = 'test external'
    ORDER BY created_at DESC
    LIMIT 1
)
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: Test the actual insert (this will show the real error)
-- ============================================================================
DO $$
DECLARE
    test_project_id UUID;
    test_user_id TEXT;
    insert_result RECORD;
BEGIN
    -- Get the project
    SELECT id, user_id INTO test_project_id, test_user_id
    FROM public.projects
    WHERE id = '799a46e2-4a97-4275-8988-b6d277de8708'
       OR title = 'test external'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'Project not found. Please update the project ID in this script.';
        RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TESTING ACTUAL INSERT SCENARIO';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Current Role: %', current_user;
    RAISE NOTICE '';
    
    -- Try to insert (simulating what your API does)
    BEGIN
        INSERT INTO public.project_stages (
            project_id,
            user_id,
            stage,
            input,
            output,
            status
        ) VALUES (
            test_project_id,
            test_user_id,
            'ideate',
            '{"test": "data"}'::text,
            '{"test": "output"}'::text,
            'completed'
        ) RETURNING * INTO insert_result;
        
        RAISE NOTICE '✅ INSERT SUCCEEDED!';
        RAISE NOTICE '   Stage ID: %', insert_result.id;
        RAISE NOTICE '';
        RAISE NOTICE '   The foreign key constraint works correctly.';
        RAISE NOTICE '   If your app still fails, the issue might be:';
        RAISE NOTICE '   1. Different user_id between projects and project_stages';
        RAISE NOTICE '   2. RLS policy blocking based on user_id mismatch';
        RAISE NOTICE '   3. The project_id in the API request is different';
        RAISE NOTICE '';
        
        -- Clean up
        DELETE FROM public.project_stages WHERE id = insert_result.id;
        RAISE NOTICE 'Test data cleaned up.';
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ FOREIGN KEY CONSTRAINT VIOLATION!';
            RAISE NOTICE '   Error: %', SQLERRM;
            RAISE NOTICE '';
            RAISE NOTICE '   This means the project_id does not exist in projects table';
            RAISE NOTICE '   OR RLS is preventing the foreign key check from seeing it.';
            RAISE NOTICE '';
            RAISE NOTICE '   Verify:';
            RAISE NOTICE '   1. Project exists: SELECT * FROM projects WHERE id = ''%'';', test_project_id;
            RAISE NOTICE '   2. RLS allows reading projects: Check projects table policies';
            
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ INSUFFICIENT PRIVILEGE!';
            RAISE NOTICE '   Error: %', SQLERRM;
            RAISE NOTICE '';
            RAISE NOTICE '   RLS is blocking the insert. Check:';
            RAISE NOTICE '   1. Service role policy exists (it does)';
            RAISE NOTICE '   2. You are using service_role credentials';
            RAISE NOTICE '   3. The user_id matches between projects and project_stages';
            
        WHEN OTHERS THEN
            RAISE NOTICE '❌ OTHER ERROR!';
            RAISE NOTICE '   Error: %', SQLERRM;
            RAISE NOTICE '   Error Code: %', SQLSTATE;
            RAISE NOTICE '   Error Detail: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    
END $$;

-- ============================================================================
-- STEP 4: Check user_id consistency
-- ============================================================================
-- This is important - if the user_id in the API request doesn't match
-- the user_id in the projects table, RLS will block the insert
SELECT 
    'STEP 4: User ID Check' AS step,
    p.id AS project_id,
    p.user_id AS project_user_id,
    'Check if this matches the user_id in your API request' AS note
FROM public.projects p
WHERE p.id = '799a46e2-4a97-4275-8988-b6d277de8708'
   OR p.title = 'test external'
ORDER BY p.created_at DESC
LIMIT 1;

-- ============================================================================
-- STEP 5: Verify projects table is readable for FK validation
-- ============================================================================
SELECT 
    'STEP 5: Projects Table Policies' AS step,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' OR cmd = 'ALL' THEN '✅ Can read'
        ELSE '⚠️  Cannot read'
    END AS read_permission,
    CASE 
        WHEN qual LIKE '%service_role%' OR with_check LIKE '%service_role%' THEN '✅ Service role bypass'
        WHEN qual LIKE '%user_id%' THEN '✅ User-based'
        ELSE '⚠️  Other'
    END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'projects'
    AND (cmd = 'SELECT' OR cmd = 'ALL')
ORDER BY cmd;


