-- Add payment tracking columns to diagnostic_submissions table
ALTER TABLE public.diagnostic_submissions         
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',                  
ADD COLUMN IF NOT EXISTS payment_id TEXT,                      
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;