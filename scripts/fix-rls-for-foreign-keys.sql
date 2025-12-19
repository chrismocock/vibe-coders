-- ============================================================================
-- FIX RLS FOR FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This script ensures RLS policies are correctly configured to work with
-- foreign key constraints. The issue might be that RLS is preventing the
-- foreign key validation from seeing the referenced project.
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure service_role policy exists on project_stages
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage all project stages" ON public.project_stages;

CREATE POLICY "Service role can manage all project stages"
  ON public.project_stages
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- ============================================================================
-- STEP 2: Ensure service_role policy exists on projects (for FK validation)
-- ============================================================================
-- The projects table needs to allow service_role to read projects so that
-- foreign key constraint validation can work when inserting into project_stages
DROP POLICY IF EXISTS "Service role can manage all projects" ON public.projects;

CREATE POLICY "Service role can manage all projects"
  ON public.projects
  FOR ALL
  USING (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    current_setting('role') = 'service_role' OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- ============================================================================
-- STEP 3: Verify both policies exist
-- ============================================================================
SELECT 
    'Policy Verification' AS check_name,
    tablename,
    policyname,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = 'public'
              AND p.tablename = t.tablename
              AND p.policyname = t.policyname
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status
FROM (
    SELECT 'project_stages' AS tablename, 'Service role can manage all project stages' AS policyname
    UNION ALL
    SELECT 'projects' AS tablename, 'Service role can manage all projects' AS policyname
) t;

-- ============================================================================
-- STEP 4: Show all service_role policies
-- ============================================================================
SELECT 
    'All Service Role Policies' AS info_type,
    tablename,
    policyname,
    cmd,
    '✅ Service role bypass' AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'project_stages')
    AND (
        qual LIKE '%service_role%' 
        OR with_check LIKE '%service_role%'
        OR policyname LIKE '%service%role%'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 5: Test the setup (if a project exists)
-- ============================================================================
DO $$
DECLARE
    test_project_id UUID;
    test_user_id TEXT;
BEGIN
    -- Get a real project to test with
    SELECT id, user_id INTO test_project_id, test_user_id
    FROM public.projects 
    LIMIT 1;
    
    IF test_project_id IS NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE 'No projects found. Create a project first, then test the insert.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '============================================================================';
        RAISE NOTICE 'TESTING SETUP';
        RAISE NOTICE '============================================================================';
        RAISE NOTICE '';
        RAISE NOTICE 'Found test project: %', test_project_id;
        RAISE NOTICE 'User ID: %', test_user_id;
        RAISE NOTICE '';
        RAISE NOTICE 'To test if this works, try inserting a stage from your application.';
        RAISE NOTICE 'The service_role policies should now allow the insert.';
        RAISE NOTICE '';
    END IF;
END $$;

-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RLS POLICIES FIXED';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Service role policies have been created/updated on both tables:';
    RAISE NOTICE '  ✅ project_stages - Service role can manage all project stages';
    RAISE NOTICE '  ✅ projects - Service role can manage all projects';
    RAISE NOTICE '';
    RAISE NOTICE 'These policies allow:';
    RAISE NOTICE '  1. Service role to insert into project_stages';
    RAISE NOTICE '  2. Service role to read from projects (for FK validation)';
    RAISE NOTICE '';
    RAISE NOTICE 'If your API uses SUPABASE_SERVICE_ROLE_KEY, it should now work.';
    RAISE NOTICE '';
    RAISE NOTICE 'If errors persist, verify:';
    RAISE NOTICE '  1. SUPABASE_SERVICE_ROLE_KEY is set in your environment';
    RAISE NOTICE '  2. The project_id being inserted actually exists';
    RAISE NOTICE '  3. Check the application logs for the actual error';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

