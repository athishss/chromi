-- ================================================================
-- Chromi: Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Profiles ───────────────────────────────────────────────
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text default '',
    bio text default '',
    skills text[] default '{}',
    time_balance decimal(10,2) default 2.00,
    rating decimal(3,2) default 0,
    completion_score decimal(5,2) default 100,
    total_exchanges integer default 0,
    hours_given decimal(10,2) default 0,
    hours_received decimal(10,2) default 0,
    community text default '',
    referred_by uuid references public.profiles(id) on delete set null,
    successful_referrals integer default 0,
    referral_processed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ── Service Listings ───────────────────────────────────────
create table if not exists public.service_listings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    category text not null check (category in ('tutoring','repair','design','cooking','music','tech','fitness','language','photography','writing','gardening','other')),
    description text not null,
    estimated_hours decimal(5,2) default 1.0 check (estimated_hours > 0),
    type text not null check (type in ('offer','request')),
    status text default 'active' check (status in ('active','paused','completed')),
    availability text default '',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ── Exchanges ──────────────────────────────────────────────
create table if not exists public.exchanges (
    id uuid default uuid_generate_v4() primary key,
    listing_id uuid references public.service_listings(id) on delete set null,
    provider_id uuid references public.profiles(id) on delete cascade not null,
    requester_id uuid references public.profiles(id) on delete cascade not null,
    status text default 'pending' check (status in ('pending','accepted','in_progress','completed','cancelled','disputed')),
    hours_exchanged decimal(5,2) default 1.0,
    created_at timestamptz default now(),
    completed_at timestamptz
);

-- ── Reviews ────────────────────────────────────────────────
create table if not exists public.reviews (
    id uuid default uuid_generate_v4() primary key,
    exchange_id uuid references public.exchanges(id) on delete cascade not null,
    reviewer_id uuid references public.profiles(id) on delete cascade not null,
    reviewee_id uuid references public.profiles(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text default '',
    created_at timestamptz default now()
);

-- ── Indexes ────────────────────────────────────────────────
create index if not exists idx_listings_user on public.service_listings(user_id);
create index if not exists idx_listings_category on public.service_listings(category);
create index if not exists idx_listings_status on public.service_listings(status);
create index if not exists idx_exchanges_provider on public.exchanges(provider_id);
create index if not exists idx_exchanges_requester on public.exchanges(requester_id);
create index if not exists idx_reviews_exchange on public.reviews(exchange_id);

-- ── Row Level Security ─────────────────────────────────────

-- Profiles: users can read all, but only update their own
alter table public.profiles enable row level security;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Service Listings: publicly readable, users manage their own
alter table public.service_listings enable row level security;
create policy "Listings are publicly readable" on public.service_listings for select using (true);
create policy "Users insert own listings" on public.service_listings for insert with check (auth.uid() = user_id);
create policy "Users update own listings" on public.service_listings for update using (auth.uid() = user_id);
create policy "Users delete own listings" on public.service_listings for delete using (auth.uid() = user_id);

-- Exchanges: users can see exchanges they're involved in
alter table public.exchanges enable row level security;
create policy "Users see own exchanges" on public.exchanges for select using (auth.uid() = provider_id or auth.uid() = requester_id);
create policy "Users create exchanges" on public.exchanges for insert with check (auth.uid() = requester_id);
create policy "Users update own exchanges" on public.exchanges for update using (auth.uid() = provider_id or auth.uid() = requester_id);

-- Reviews: publicly readable, users insert their own
alter table public.reviews enable row level security;
create policy "Reviews are publicly readable" on public.reviews for select using (true);
create policy "Users insert own reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- ── Auto-create profile on signup ──────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, referred_by)
    values (
        new.id, 
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        case when (new.raw_user_meta_data->>'referred_by') is not null and (new.raw_user_meta_data->>'referred_by') != '' then (new.raw_user_meta_data->>'referred_by')::uuid else null end
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
