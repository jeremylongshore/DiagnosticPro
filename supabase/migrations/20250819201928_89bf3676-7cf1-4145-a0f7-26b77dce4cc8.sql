-- First, make sure RLS is enabled (this might already be done)
ALTER TABLE public.diagnostic_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert new records
-- The name "allow_public_insert" is just a label to help you remember what this policy does
CREATE POLICY "allow_public_insert" 
ON public.diagnostic_submissions 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Grant only the specific permission needed - INSERT - to anonymous users
-- This is much safer than granting ALL permissions
GRANT INSERT ON public.diagnostic_submissions TO anon;