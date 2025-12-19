-- ============================================================================
-- ENSURE SERVICE ROLE POLICY EXISTS FOR project_stages
-- ============================================================================
-- This script ensures the service_role bypass policy exists on project_stages
-- which is required for API calls using service_role credentials
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if service_role policy exists
-- ============================================================================
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_stages'
          AND policyname = 'Service role can manage all project stages'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        RAISE NOTICE 'Service role policy already exists.';
    ELSE
        RAISE NOTICE 'Service role policy is MISSING. Creating it now...';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop existing policy if it exists (to recreate it)
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage all project stages" ON public.project_stages;

-- ============================================================================
-- STEP 3: Create the service_role bypass policy
-- ============================================================================
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
-- STEP 4: Verify the policy was created
-- ============================================================================
SELECT 
    'VERIFICATION: Service Role Policy' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'project_stages'
              AND policyname = 'Service role can manage all project stages'
        ) THEN '✅ POLICY EXISTS'
        ELSE '❌ POLICY STILL MISSING'
    END AS status,
    'Policy allows service_role to bypass RLS' AS details;

-- ============================================================================
-- STEP 5: Show all policies on project_stages
-- ============================================================================
SELECT 
    'All Policies on project_stages' AS info_type,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname = 'Service role can manage all project stages' THEN '✅ Service role bypass'
        WHEN cmd = 'INSERT' THEN '✅ INSERT policy'
        WHEN cmd = 'SELECT' THEN '✅ SELECT policy'
        WHEN cmd = 'UPDATE' THEN '✅ UPDATE policy'
        WHEN cmd = 'DELETE' THEN '✅ DELETE policy'
        WHEN cmd = 'ALL' THEN '✅ ALL operations'
        ELSE 'Other'
    END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'project_stages'
ORDER BY 
    CASE 
        WHEN policyname = 'Service role can manage all project stages' THEN 1
        WHEN cmd = 'ALL' THEN 2
        ELSE 3
    END,
    cmd,
    policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SERVICE ROLE POLICY SETUP COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The service_role bypass policy has been created/verified.';
    RAISE NOTICE '';
    RAISE NOTICE 'If your API uses service_role credentials, this policy will allow';
    RAISE NOTICE 'inserts to bypass RLS checks.';
    RAISE NOTICE '';
    RAISE NOTICE 'If errors persist, also check:';
    RAISE NOTICE '  1. Your API is actually using service_role (not anon/authenticated)';
    RAISE NOTICE '  2. The projects table has a service_role policy (it should)';
    RAISE NOTICE '  3. The project_id being inserted actually exists';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;



