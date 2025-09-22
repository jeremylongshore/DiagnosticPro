-- Ensure RLS policies allow proper data insertion and updates for diagnostic submissions
-- Keep the existing public read policy for paid submissions

-- Drop and recreate INSERT policies to ensure they work properly
DROP POLICY IF EXISTS "Anyone can submit diagnostics" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "allow_public_insert" ON public.diagnostic_submissions;

-- Create a single comprehensive INSERT policy
CREATE POLICY "Allow public insert diagnostic submissions" 
ON public.diagnostic_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow service role to update payment status and other fields
CREATE POLICY "Service role can update submissions" 
ON public.diagnostic_submissions 
FOR UPDATE 
USING (
  ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text 
  OR auth.role() = 'service_role'::text
);