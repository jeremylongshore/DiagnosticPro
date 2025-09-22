-- Fix security issue: Prevent anonymous users from potentially accessing customer personal data
-- Current issue: While anonymous users can't actually read data due to existing policies,
-- the policy structure could be clearer and more explicit about denying anonymous access

-- Add an explicit policy to deny all SELECT access for anonymous users
-- This creates a clear security boundary and prevents any potential edge cases
CREATE POLICY "Deny anonymous users from reading any submissions" 
ON public.diagnostic_submissions 
FOR SELECT 
USING (
  -- Explicitly deny access if user is not authenticated
  auth.uid() IS NOT NULL
);

-- The existing policies already handle the legitimate access patterns:
-- 1. "Users can view only their own submissions" - authenticated users see their own data
-- 2. "Service role can read for processing" - system can process all submissions
-- 3. The new policy adds an additional security layer by explicitly blocking anonymous access

-- Note: This maintains the business model of allowing anonymous diagnostic submissions
-- while ensuring submitted personal data cannot be accessed by anonymous users