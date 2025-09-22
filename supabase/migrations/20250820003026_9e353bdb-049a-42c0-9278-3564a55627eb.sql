-- Insert the missing order record for the recent payment
INSERT INTO public.orders (
  customer_email, 
  amount, 
  currency, 
  status, 
  submission_id,
  paid_at,
  stripe_session_id
) VALUES (
  'jeremylongshore@gmail.com', 
  4999, 
  'usd', 
  'paid', 
  'bc542dc1-d1e8-4ec4-86f4-e9a97eb0c879',
  now(),
  'cs_manual_recovery_' || extract(epoch from now())::text
);

-- Update the diagnostic submission payment status
UPDATE public.diagnostic_submissions 
SET 
  payment_status = 'paid',
  paid_at = now(),
  payment_id = 'cs_manual_recovery_' || extract(epoch from now())::text
WHERE id = 'bc542dc1-d1e8-4ec4-86f4-e9a97eb0c879';