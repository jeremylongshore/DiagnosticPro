-- Add better status tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'retrying'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_processing_status ON public.orders(processing_status);
CREATE INDEX IF NOT EXISTS idx_orders_email_status ON public.orders(email_status);

-- Update diagnostic_submissions with better tracking
ALTER TABLE public.diagnostic_submissions 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id),
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_analysis_status ON public.diagnostic_submissions(analysis_status);