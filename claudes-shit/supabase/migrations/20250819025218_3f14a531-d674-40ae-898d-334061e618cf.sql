-- Fix critical security issue: Restrict email_logs read access to service roles only
-- Currently the email_logs table allows public read access which exposes:
-- - Customer email addresses (to_email column)
-- - Email subjects and content 
-- - System error logs and internal operations
-- - Links to diagnostic submissions

-- Drop the overly permissive read policy
DROP POLICY IF EXISTS "System can read email logs" ON public.email_logs;

-- Create a new restrictive policy that only allows service roles to read logs
CREATE POLICY "Service roles can read email logs" 
ON public.email_logs 
FOR SELECT 
USING (
  -- Only allow service role access for system operations
  (((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'service_role'::text) 
  OR (auth.role() = 'service_role'::text)
);

-- Keep the existing insert policy as it's correctly configured
-- INSERT policy allows system to log emails but doesn't expose data to users