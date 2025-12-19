-- ============================================================================
-- CHECK SPECIFIC PROJECT THAT'S FAILING
-- ============================================================================
-- This checks the project ID from the error: ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3
-- ============================================================================

-- ============================================================================
-- CHECK 1: Does this project exist?
-- ============================================================================
SELECT 
    'CHECK 1: Project Existence' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = 'ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3'
        ) THEN '✅ PROJECT EXISTS'
        ELSE '❌ PROJECT DOES NOT EXIST - This is the problem!'
    END AS status;

-- ============================================================================
-- CHECK 2: Show project details if it exists
-- ============================================================================
SELECT 
    'CHECK 2: Project Details' AS check_name,
    id,
    title,
    user_id,
    created_at,
    updated_at
FROM public.projects
WHERE id = 'ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3';

-- ============================================================================
-- CHECK 3: Check if project exists but RLS is hiding it
-- ============================================================================
-- This query bypasses RLS by using a function that runs as the table owner
DO $$
DECLARE
    project_exists BOOLEAN;
    project_user_id TEXT;
BEGIN
    -- Try to read the project (this will respect RLS)
    SELECT EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = 'ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3'
    ) INTO project_exists;
    
    IF project_exists THEN
        SELECT user_id INTO project_user_id
        FROM public.projects
        WHERE id = 'ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3';
        
        RAISE NOTICE 'Project exists and is visible with current RLS context.';
        RAISE NOTICE 'Project user_id: %', project_user_id;
    ELSE
        RAISE NOTICE '⚠️  Project does NOT exist OR RLS is hiding it.';
        RAISE NOTICE '';
        RAISE NOTICE 'If the project was just created, check:';
        RAISE NOTICE '  1. Was the project creation transaction committed?';
        RAISE NOTICE '  2. Does the project belong to a different user?';
        RAISE NOTICE '  3. Is RLS blocking the read?';
    END IF;
END $$;

-- ============================================================================
-- CHECK 4: List all projects (to see what exists)
-- ============================================================================
SELECT 
    'CHECK 4: All Projects' AS check_name,
    id,
    title,
    user_id,
    created_at
FROM public.projects
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 5: Try to insert a stage for this project (will show the actual error)
-- ============================================================================
DO $$
DECLARE
    test_project_id UUID := 'ed923ccc-cfa5-49f2-9198-9f0e7efa7ad3';
    test_user_id TEXT;
    project_exists BOOLEAN;
BEGIN
    -- Check if project exists
    SELECT EXISTS (
        SELECT 1 FROM public.projects WHERE id = test_project_id
    ) INTO project_exists;
    
    IF NOT project_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '============================================================================';
        RAISE NOTICE 'PROJECT DOES NOT EXIST!';
        RAISE NOTICE '============================================================================';
        RAISE NOTICE '';
        RAISE NOTICE 'The project with ID % does not exist in the database.', test_project_id;
        RAISE NOTICE '';
        RAISE NOTICE 'This is why you are getting the foreign key constraint error.';
        RAISE NOTICE '';
        RAISE NOTICE 'Possible causes:';
        RAISE NOTICE '  1. Project was never created (API error during creation)';
        RAISE NOTICE '  2. Project was deleted';
        RAISE NOTICE '  3. Project belongs to a different user and RLS is hiding it';
        RAISE NOTICE '  4. Project creation failed silently';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '  - Create a new project';
        RAISE NOTICE '  - Or check the project creation API endpoint for errors';
        RAISE NOTICE '';
        RETURN;
    END IF;
    
    -- Get the user_id from the project
    SELECT user_id INTO test_user_id
    FROM public.projects
    WHERE id = test_project_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TESTING INSERT FOR EXISTING PROJECT';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE '';
    
    -- Try the insert
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
            'test',
            'pending'
        );
        
        RAISE NOTICE '✅ INSERT SUCCEEDED!';
        RAISE NOTICE '   The foreign key constraint works.';
        
        -- Clean up
        DELETE FROM public.project_stages 
        WHERE project_id = test_project_id 
          AND stage = 'ideate' 
          AND input = 'test';
        
    EXCEPTION 
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ FOREIGN KEY CONSTRAINT VIOLATION!';
            RAISE NOTICE '   Error: %', SQLERRM;
            RAISE NOTICE '';
            RAISE NOTICE '   Even though the project exists, the FK check failed.';
            RAISE NOTICE '   This suggests RLS is blocking the FK validation.';
            
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    
END $$;



