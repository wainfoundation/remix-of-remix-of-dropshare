-- Add subscription and desired account type fields to profiles
-- Run in Supabase SQL editor or via CLI

alter table public.profiles
  add column if not exists desired_account_type text check (desired_account_type in ('business','creator','shopper')),
  add column if not exists subscription_status text not null default 'none' check (subscription_status in ('none','active','expired','canceled')),
  add column if not exists subscription_plan text,
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists last_payment_at timestamptz;

-- Index to speed up sweeper queries
create index if not exists idx_profiles_subscription_expires_at
  on public.profiles (subscription_expires_at);
