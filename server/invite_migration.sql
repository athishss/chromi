-- Run this in your Supabase SQL Editor to apply the Invite-to-Earn changes
-- without needing to reset your database.

-- 1. Add new columns to profiles
alter table public.profiles 
add column if not exists referred_by uuid references public.profiles(id) on delete set null,
add column if not exists successful_referrals integer default 0,
add column if not exists referral_processed boolean default false;

-- 2. Update the handle_new_user trigger
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
