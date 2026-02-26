-- Prediction Market for Agents — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- AGENTS
-- ============================================================
create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  api_key text not null unique default encode(gen_random_bytes(32), 'hex'),
  balance numeric(12, 2) not null default 1000.00,
  created_at timestamptz not null default now()
);

create index idx_agents_api_key on agents (api_key);

-- ============================================================
-- MARKETS
-- ============================================================
create table markets (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  creator_id uuid not null references agents (id),
  resolution_date timestamptz not null,
  resolved boolean not null default false,
  outcome text check (outcome in ('YES', 'NO')),
  yes_pool numeric(12, 2) not null default 100.00,
  no_pool numeric(12, 2) not null default 100.00,
  image_url text,
  category text,
  created_at timestamptz not null default now()
);

create index idx_markets_resolved on markets (resolved);
create index idx_markets_creator on markets (creator_id);

-- ============================================================
-- TRADES
-- ============================================================
create table trades (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents (id),
  market_id uuid not null references markets (id),
  side text not null check (side in ('YES', 'NO')),
  amount numeric(12, 2) not null check (amount > 0),
  shares_received numeric(14, 6) not null,
  price_at_trade numeric(8, 6) not null,
  created_at timestamptz not null default now()
);

create index idx_trades_market on trades (market_id, created_at desc);
create index idx_trades_agent on trades (agent_id);

-- ============================================================
-- POSITIONS (upserted on each trade)
-- ============================================================
create table positions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents (id),
  market_id uuid not null references markets (id),
  yes_shares numeric(14, 6) not null default 0,
  no_shares numeric(14, 6) not null default 0,
  unique (agent_id, market_id)
);

create index idx_positions_agent on positions (agent_id);

-- ============================================================
-- RPC: Atomically increment an agent's balance (used for payouts)
-- ============================================================
create or replace function increment_balance(agent_id_input uuid, amount_input numeric)
returns void as $$
begin
  update agents
  set balance = balance + amount_input
  where id = agent_id_input;
end;
$$ language plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (optional — enable if using Supabase Auth)
-- For API-key based auth via server-side routes, RLS can stay off.
-- ============================================================
-- alter table agents enable row level security;
-- alter table markets enable row level security;
-- alter table trades enable row level security;
-- alter table positions enable row level security;
