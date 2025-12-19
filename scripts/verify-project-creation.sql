-- ============================================================================
-- VERIFY PROJECT CREATION SCRIPT
-- ============================================================================
-- This script helps verify that projects are being created correctly
-- and that the project_id can be used in foreign key relationships
-- ============================================================================

-- ============================================================================
-- CHECK 1: List all projects with their IDs
-- ============================================================================
SELECT 
    'CHECK 1: All Projects' AS check_name,
    id,
    title,
    user_id,
    created_at,
    CASE 
        WHEN id IS NULL THEN '❌ NULL ID'
        WHEN id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '⚠️  Invalid UUID format'
        ELSE '✅ Valid UUID'
    END AS id_status
FROM public.projects
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 2: Check for projects with matching project_stages
-- ============================================================================
SELECT 
    'CHECK 2: Projects with Stages' AS check_name,
    p.id AS project_id,
    p.title,
    COUNT(ps.id) AS stage_count,
    CASE 
        WHEN COUNT(ps.id) > 0 THEN '✅ Has stages'
        ELSE '⚠️  No stages'
    END AS status
FROM public.projects p
LEFT JOIN public.project_stages ps ON p.id = ps.project_id
GROUP BY p.id, p.title
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 3: Find orphaned project_stages (stages without projects)
-- ============================================================================
SELECT 
    'CHECK 3: Orphaned Stages' AS check_name,
    ps.id AS stage_id,
    ps.project_id,
    ps.stage,
    ps.user_id,
    CASE 
        WHEN p.id IS NULL THEN '❌ ORPHANED - Project does not exist'
        ELSE '✅ Valid'
    END AS status
FROM public.project_stages ps
LEFT JOIN public.projects p ON ps.project_id = p.id
WHERE p.id IS NULL
LIMIT 10;

-- ============================================================================
-- CHECK 4: Test project creation (dry run)
-- ============================================================================
DO $$
DECLARE
    test_user_id TEXT := 'test-user-' || gen_random_uuid()::text;
    new_project_id UUID;
    insert_success BOOLEAN := false;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TEST: Project Creation';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Attempting to create a test project...';
    
    BEGIN
        INSERT INTO public.projects (
            title,
            user_id,
            description
        ) VALUES (
            'Test Project - ' || CURRENT_TIMESTAMP::text,
            test_user_id,
            'Test project for verification'
        ) RETURNING id INTO new_project_id;
        
        RAISE NOTICE '✅ Project created successfully!';
        RAISE NOTICE '   Project ID: %', new_project_id;
        RAISE NOTICE '   User ID: %', test_user_id;
        
        insert_success := true;
        
        -- Now test if we can create a stage for this project
        RAISE NOTICE '';
        RAISE NOTICE 'Testing stage creation for this project...';
        
        BEGIN
            INSERT INTO public.project_stages (
                project_id,
                user_id,
                stage,
                input,
                status
            ) VALUES (
                new_project_id,
                test_user_id,
                'ideate',
                'Test input data',
                'pending'
            );
            
            RAISE NOTICE '✅ Stage created successfully!';
            RAISE NOTICE '   This confirms the foreign key constraint works.';
            
            -- Clean up test data
            DELETE FROM public.project_stages WHERE project_id = new_project_id;
            DELETE FROM public.projects WHERE id = new_project_id;
            
            RAISE NOTICE '';
            RAISE NOTICE '✅ Test data cleaned up.';
            
        EXCEPTION 
            WHEN foreign_key_violation THEN
                RAISE NOTICE '❌ FOREIGN KEY CONSTRAINT VIOLATION!';
                RAISE NOTICE '   Error: %', SQLERRM;
                RAISE NOTICE '   This indicates the constraint is blocking the insert.';
                
                -- Clean up project
                DELETE FROM public.projects WHERE id = new_project_id;
                
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Error creating stage: %', SQLERRM;
                RAISE NOTICE '   Error Code: %', SQLSTATE;
                
                -- Clean up project
                DELETE FROM public.projects WHERE id = new_project_id;
        END;
        
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error creating project: %', SQLERRM;
            RAISE NOTICE '   Error Code: %', SQLSTATE;
            RAISE NOTICE '   This might be an RLS policy issue.';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    
END $$;

-- ============================================================================
-- CHECK 5: Verify UUID format consistency
-- ============================================================================
SELECT 
    'CHECK 5: UUID Format Check' AS check_name,
    'projects.id' AS column_name,
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') AS valid_uuids,
    COUNT(*) FILTER (WHERE id IS NULL) AS null_ids
FROM public.projects

UNION ALL

SELECT 
    'CHECK 5: UUID Format Check' AS check_name,
    'project_stages.project_id' AS column_name,
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE project_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') AS valid_uuids,
    COUNT(*) FILTER (WHERE project_id IS NULL) AS null_ids
FROM public.project_stages;

-- ============================================================================
-- CHECK 6: Show recent project creation activity
-- ============================================================================
SELECT 
    'CHECK 6: Recent Projects' AS check_name,
    id,
    title,
    user_id,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_ago
FROM public.projects
ORDER BY created_at DESC
LIMIT 5;



