-- ============================================================================
-- QUICK CHECK: project_stages RLS Policies
-- ============================================================================
-- Run this to see if the service_role policy exists on project_stages
-- ============================================================================

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname = 'Service role can manage all project stages' THEN '✅ Service role bypass'
        WHEN cmd = 'INSERT' THEN '✅ INSERT policy'
        WHEN cmd = 'SELECT' THEN '✅ SELECT policy'
        WHEN cmd = 'UPDATE' THEN '✅ UPDATE policy'
        WHEN cmd = 'DELETE' THEN '✅ DELETE policy'
        WHEN cmd = 'ALL' THEN '✅ ALL operations'
        ELSE 'Other'
    END AS policy_type,
    qual AS using_clause,
    with_check AS with_check_clause
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
-- Check if service_role policy specifically exists
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'project_stages'
              AND policyname = 'Service role can manage all project stages'
        ) THEN '✅ Service role policy EXISTS'
        ELSE '❌ Service role policy MISSING - Run fix-rls-for-foreign-keys.sql'
    END AS service_role_policy_status;



