-- Simplify security to allow basic anonymous workflow
-- Remove all complex policies and create simple ones that just work

-- Drop all existing policies on diagnostic_submissions
DROP POLICY IF EXISTS "Allow all user submissions" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Users can view only their own submissions" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Service role can read for processing" ON public.diagnostic_submissions;

-- Create simple policies that just work for the business workflow
-- Allow anyone to insert data (anonymous diagnostic submissions)
CREATE POLICY "Anyone can submit diagnostics" 
ON public.diagnostic_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow service role to read all data for AI processing and email delivery
CREATE POLICY "Service role can read all submissions" 
ON public.diagnostic_submissions 
FOR SELECT 
USING (
  -- Service role can read everything for processing
  ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text
  OR auth.role() = 'service_role'::text
);

-- That's it. Simple. Anonymous users can submit, system can process.
-- No complex user authentication requirements blocking the workflow.