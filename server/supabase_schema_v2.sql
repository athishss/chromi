-- ================================================================
-- Chromi: Supabase Schema V2 (Feature Expansion)
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- This file adds columns to existing tables and creates new tables.
-- ================================================================

-- ── 1. Update Existing Tables ───────────────────────────────

-- Update Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS campus text DEFAULT '',
ADD COLUMN IF NOT EXISTS trust_score decimal(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS punctuality_score decimal(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS endorsements_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS negative_balance_allowed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_negative decimal(10,2) DEFAULT -5.00,
ADD COLUMN IF NOT EXISTS total_cancellations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Update Service Listings
ALTER TABLE public.service_listings 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
ADD COLUMN IF NOT EXISTS is_resource boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS resource_deposit decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS resource_condition text DEFAULT '',
ADD COLUMN IF NOT EXISTS demand_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update Exchanges
ALTER TABLE public.exchanges 
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS scheduled_end_at timestamptz,
ADD COLUMN IF NOT EXISTS escrow_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS escrow_amount decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS penalty_applied decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_partial boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_exchange_id uuid REFERENCES public.exchanges(id);

-- ── 2. Create New Tables ──────────────────────────────────────

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Endorsements
CREATE TABLE IF NOT EXISTS public.endorsements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    endorser_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    endorsed_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill text NOT NULL,
    comment text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    UNIQUE(endorser_id, endorsed_id, skill)
);

-- Disputes
CREATE TABLE IF NOT EXISTS public.disputes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
    filed_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    against uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_notes text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz
);

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    listing_id uuid REFERENCES public.service_listings(id) ON DELETE CASCADE,
    category text,
    created_at timestamptz DEFAULT now(),
    notified_at timestamptz
);

-- Resources (for lending items)
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id uuid REFERENCES public.service_listings(id) ON DELETE CASCADE NOT NULL,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    condition_before text DEFAULT '',
    condition_after text DEFAULT '',
    condition_photos_before text[] DEFAULT '{}',
    condition_photos_after text[] DEFAULT '{}',
    deposit_amount decimal(10,2) DEFAULT 0,
    deposit_returned boolean DEFAULT false,
    damage_reported boolean DEFAULT false,
    damage_notes text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- Credit Transactions (Ledger)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount decimal(10,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('earn', 'spend', 'escrow_lock', 'escrow_release', 'penalty', 'bonus', 'borrow')),
    reference_id uuid, -- could be exchange_id
    description text NOT NULL,
    balance_after decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Community Groups
CREATE TABLE IF NOT EXISTS public.community_groups (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    campus text DEFAULT '',
    description text DEFAULT '',
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    member_count integer DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

-- Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at timestamptz DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Badges (Metadata for gamification)
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    criteria jsonb DEFAULT '{}'::jsonb
);

-- User Badges (Mapping users to earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type text NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- ── 3. Row Level Security Policies ────────────────────────────

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see and update their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Endorsements: Publicly readable, users can insert their own
CREATE POLICY "Endorsements are publicly readable" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Users insert own endorsements" ON public.endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);

-- Disputes: Users can view disputes they are involved in
CREATE POLICY "Users can view own disputes" ON public.disputes FOR SELECT USING (auth.uid() = filed_by OR auth.uid() = against);
CREATE POLICY "Users can insert disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = filed_by);

-- Waitlist: Users can view and manage their own waitlist
CREATE POLICY "Users can view own waitlist" ON public.waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waitlist" ON public.waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own waitlist" ON public.waitlist FOR DELETE USING (auth.uid() = user_id);

-- Resources: Publicly readable, users can insert/update their own
CREATE POLICY "Resources are publicly readable" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Users insert own resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own resources" ON public.resources FOR UPDATE USING (auth.uid() = owner_id);

-- Credit Transactions: Users can view their own
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Community Groups: Publicly readable, anyone can insert
CREATE POLICY "Groups are publicly readable" ON public.community_groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON public.community_groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Group Members: Publicly readable, users can insert/delete their own
CREATE POLICY "Group members are publicly readable" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Badges: Publicly readable
CREATE POLICY "Badges are publicly readable" ON public.badges FOR SELECT USING (true);

-- User Badges: Publicly readable
CREATE POLICY "User badges are publicly readable" ON public.user_badges FOR SELECT USING (true);

-- Analytics: Insert only for users
CREATE POLICY "Users can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
