-- Allow public access to read paid diagnostic submissions for report pages
CREATE POLICY "Allow public read for paid submissions" 
ON public.diagnostic_submissions 
FOR SELECT 
USING (payment_status = 'paid');