-- Migration: Add category column to markets and backfill existing data
-- Run this in your Supabase SQL Editor

ALTER TABLE markets ADD COLUMN IF NOT EXISTS category text;

-- Backfill seeded markets based on question content
UPDATE markets SET category = 'Politics' WHERE category IS NULL AND (question ILIKE '%government shutdown%' OR question ILIKE '%supreme court%' OR question ILIKE '%minimum wage%' OR question ILIKE '%marijuana%' OR question ILIKE '%paris climate%' OR question ILIKE '%snap general election%' OR question ILIKE '%EU%AI regulation%');
UPDATE markets SET category = 'Economics' WHERE category IS NULL AND (question ILIKE '%S&P 500%' OR question ILIKE '%federal reserve%' OR question ILIKE '%bitcoin%' OR question ILIKE '%inflation%CPI%' OR question ILIKE '%national debt%' OR question ILIKE '%ethereum%' OR question ILIKE '%unemployment rate%');
UPDATE markets SET category = 'Tech' WHERE category IS NULL AND (question ILIKE '%GPT-5%' OR question ILIKE '%apple%foldable%' OR question ILIKE '%starship%' OR question ILIKE '%robotaxi%' OR question ILIKE '%quantum%RSA%' OR question ILIKE '%artemis%moon%' OR question ILIKE '%EV sales%');
UPDATE markets SET category = 'Sports' WHERE category IS NULL AND (question ILIKE '%winter olympics%' OR question ILIKE '%100m%' OR question ILIKE '%champions league%' OR question ILIKE '%NFL%undefeated%' OR question ILIKE '%ohtani%' OR question ILIKE '%FIFA world cup%');
UPDATE markets SET category = 'Climate' WHERE category IS NULL AND (question ILIKE '%hottest year%' OR question ILIKE '%hurricane%' OR question ILIKE '%CO2%ppm%' OR question ILIKE '%arctic%ice-free%' OR question ILIKE '%drought%' OR question ILIKE '%flooding%');
UPDATE markets SET category = 'Entertainment' WHERE category IS NULL AND (question ILIKE '%best picture%' OR question ILIKE '%taylor swift%' OR question ILIKE '%GTA VI%' OR question ILIKE '%K-pop%' OR question ILIKE '%box office%' OR question ILIKE '%AI-generated song%');
UPDATE markets SET category = 'Companies' WHERE category IS NULL AND (question ILIKE '%tesla%deliver%' OR question ILIKE '%tiktok%banned%' OR question ILIKE '%nvidia%market cap%' OR question ILIKE '%amazon%satellite%' OR question ILIKE '%twitter%profitable%' OR question ILIKE '%FAANG%layoffs%');
UPDATE markets SET category = 'World' WHERE category IS NULL AND (question ILIKE '%ceasefire%ukraine%' OR question ILIKE '%china%GDP%' OR question ILIKE '%india%population%' OR question ILIKE '%WHO%health emergency%' OR question ILIKE '%european union%');
