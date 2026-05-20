-- Add Meeting Details columns to service_listings
ALTER TABLE public.service_listings 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS meeting_password text,
ADD COLUMN IF NOT EXISTS offline_venue text,
ADD COLUMN IF NOT EXISTS offline_date text,
ADD COLUMN IF NOT EXISTS offline_time text;
