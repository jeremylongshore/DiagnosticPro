-- Fix the policy conflict that's blocking anonymous submissions
-- The "Deny anonymous users from reading any submissions" policy I just added
-- is creating a conflict with the INSERT operation for anonymous users
-- This is because when Postgres evaluates INSERT with RETURNING, it also checks SELECT policies

-- Remove the conflicting policy
DROP POLICY IF EXISTS "Deny anonymous users from reading any submissions" ON public.diagnostic_submissions;

-- The existing policies already provide adequate security:
-- 1. "Users can view only their own submissions" - authenticated users see only their data
-- 2. "Service role can read for processing" - system can process submissions  
-- Anonymous users already cannot read data because there's no policy that allows it
-- (the existing policies require either auth.uid() IS NOT NULL or specific service role access)

-- This restores the ability for anonymous users to submit diagnostic data
-- while maintaining all existing security protections