-- YARDXWORK orders table
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/yrcokchfyfkdbnmaynyt/sql

create table if not exists orders (
  id              uuid default gen_random_uuid() primary key,
  order_number    text unique not null,
  stripe_session  text unique not null,
  status          text default 'paid' not null,

  -- File
  file_name       text not null,
  vol_cm3         numeric,
  scale_factor    numeric,
  max_dim_mm      numeric,

  -- Config
  size_preset     text,
  scale           numeric,
  color_id        text,
  color_name      text,
  qty             integer not null default 1,

  -- Pricing
  unit_price      numeric,
  total_price     numeric not null,
  discount        numeric default 0,
  grams           numeric,

  -- Shipping
  shipping_name   text not null,
  shipping_email  text not null,
  shipping_addr   text,
  shipping_city   text,
  shipping_state  text,
  shipping_zip    text,

  created_at      timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_orders_email on orders (shipping_email);
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_created on orders (created_at desc);
