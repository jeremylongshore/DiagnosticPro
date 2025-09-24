-- Add redirect columns to orders table for webhook-triggered redirects
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS redirect_ready boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS redirect_url text;