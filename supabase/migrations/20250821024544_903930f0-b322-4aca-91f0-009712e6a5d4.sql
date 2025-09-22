-- Add analysis column to orders table to store AI diagnostic analysis
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS analysis TEXT;