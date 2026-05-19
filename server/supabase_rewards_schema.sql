-- ================================================================
-- Chromi: Rewards Schema Update
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.claimed_rewards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_key text NOT NULL,
    claimed_at timestamptz DEFAULT now(),
    UNIQUE(user_id, reward_key)
);

-- We don't need a timestamp in profiles because we can track daily claims 
-- by inserting 'daily_YYYY_MM_DD' as the reward_key. The unique constraint 
-- guarantees it can only be claimed exactly once per day.
