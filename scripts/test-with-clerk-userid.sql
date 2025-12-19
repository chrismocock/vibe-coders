-- ============================================================================
-- TEST WITH CLERK USER ID SCENARIO
-- ============================================================================
-- This tests the exact scenario: API uses service_role but passes Clerk userId
-- ============================================================================

-- ============================================================================
-- STEP 1: Get the project and its user_id
-- ============================================================================
SELECT 
    'Project Info' AS info_type,
    id AS project_id,
    user_id AS project_user_id,
    title
FROM public.projects
WHERE id = '799a46e2-4a97-4275-8988-b6d277de8708'
   OR title = 'test external'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- STEP 2: Test insert with the actual user_id from the project
-- ============================================================================
-- This simulates what happens when the API uses service_role but passes
-- the Clerk userId in the insert
DO $$
DECLARE
    test_project_id UUID;
    test_user_id TEXT;
    insert_success BOOLEAN := false;
BEGIN
    -- Get the actual project
    SELECT id, user_id INTO test_project_id, test_user_id
    FROM public.projects
    WHERE id = '799a46e2-4a97-4275-8988-b6d277de8708'
       OR title = 'test external'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RAISE NOTICE 'Project not found. Update the project ID in this script.';
        RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TESTING WITH ACTUAL PROJECT DATA';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'Project User ID: %', test_user_id;
    RAISE NOTICE 'Current Database Role: %', current_user;
    RAISE NOTICE '';
    RAISE NOTICE 'Simulating API insert with service_role + Clerk userId...';
    RAISE NOTICE '';
    
    -- Try the insert (this is what your API does)
    BEGIN
        INSERT INTO public.project_stages (
            project_id,
            user_id,
            stage,
            input,
            output,
            status,
            created_at,
            updated_at
        ) VALUES (
            test_project_id,
            test_user_id,  -- This is the Clerk userId from the project
            'ideate',
            '{"mode": "idea", "input": "test"}'::text,
            '{"test": "output"}'::text,
            'completed',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ INSERT SUCCEEDED!';
        RAISE NOTICE '';
        RAISE NOTICE 'The insert works. If your app still fails, check:';
        RAISE NOTICE '  1. The userId from Clerk auth matches the project user_id';
        RAISE NOTICE '  2. The project_id in the URL matches the actual project';
        RAISE NOTICE '  3. Check browser console/network tab for the actual error';
        
        insert_success := true;
        
        -- Clean up
        DELETE FROM public.project_stages 
        WHERE project_id = test_project_id 
          AND stage = 'ideate'
          AND input = '{"mode": "idea", "input": "test"}'::text;
        
        RAISE NOTICE '';
        RAISE NOTICE 'Test data cleaned up.';
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ FOREIGN KEY CONSTRAINT VIOLATION!';
            RAISE NOTICE '   Error: %', SQLERRM;
            RAISE NOTICE '';
            RAISE NOTICE '   This is the same error you are seeing.';
            RAISE NOTICE '   Possible causes:';
            RAISE NOTICE '   1. RLS is blocking the FK check from reading projects table';
            RAISE NOTICE '   2. The project_id format is wrong (string vs UUID)';
            RAISE NOTICE '   3. The project was deleted between creation and insert';
            RAISE NOTICE '';
            RAISE NOTICE '   Next steps:';
            RAISE NOTICE '   - Verify project exists: SELECT * FROM projects WHERE id = ''%'';', test_project_id;
            RAISE NOTICE '   - Check projects table RLS policies allow service_role to read';
            
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: %', SQLERRM;
            RAISE NOTICE '   Error Code: %', SQLSTATE;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    
END $$;

-- ============================================================================
-- STEP 3: Check if there's a mismatch between project user_id and what's being inserted
-- ============================================================================
-- This is critical - if the API passes a different user_id than what's in projects,
-- the RLS policy might block it
SELECT 
    'User ID Verification' AS check_name,
    p.id AS project_id,
    p.user_id AS project_user_id,
    'Make sure your API passes this exact user_id when inserting stages' AS note
FROM public.projects p
WHERE p.id = '799a46e2-4a97-4275-8988-b6d277de8708'
   OR p.title = 'test external'
ORDER BY p.created_at DESC
LIMIT 1;



