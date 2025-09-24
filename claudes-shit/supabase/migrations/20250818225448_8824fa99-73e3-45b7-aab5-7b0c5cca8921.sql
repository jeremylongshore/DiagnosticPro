-- Drop conflicting policies to avoid conflicts
DROP POLICY IF EXISTS "Allow inserts for all users" ON public.diagnostic_submissions;
DROP POLICY IF EXISTS "Enable anonymous submissions" ON public.diagnostic_submissions;

-- Create a single, comprehensive insert policy that handles both cases
CREATE POLICY "Allow all user submissions" 
ON public.diagnostic_submissions 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous users (user_id is null and no auth)
  (user_id IS NULL) OR 
  -- Allow authenticated users (user_id matches auth.uid())
  (auth.uid() = user_id)
);