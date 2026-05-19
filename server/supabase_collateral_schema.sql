-- 1. Add resource fields to service_listings (from previous session)
ALTER TABLE public.service_listings 
ADD COLUMN IF NOT EXISTS is_resource boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS resource_deposit decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS resource_condition text DEFAULT '';

-- 2. Create resources table (from previous session)
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id uuid REFERENCES public.service_listings(id) ON DELETE CASCADE,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    condition_before text DEFAULT '',
    condition_after text DEFAULT '',
    damage_reported boolean DEFAULT false,
    damage_notes text DEFAULT '',
    deposit_amount decimal(10,2) DEFAULT 0,
    deposit_returned boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Add collateral fields to exchanges
ALTER TABLE public.exchanges 
ADD COLUMN IF NOT EXISTS collateral_item text DEFAULT '',
ADD COLUMN IF NOT EXISTS collateral_photo_url text DEFAULT '';
