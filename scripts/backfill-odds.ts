/**
 * Backfill Odds: Updates existing Kalshi-synced markets to match Kalshi's actual prices.
 * Skips markets that already have trades (pools have shifted from defaults).
 *
 * Usage: npx tsx scripts/backfill-odds.ts
 */

import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

function poolsFromPrice(
  yesPrice: number,
  totalLiquidity = 200,
): { yes_pool: number; no_pool: number } {
  const decimal = yesPrice > 1 ? yesPrice / 100 : yesPrice;
  const clamped = Math.max(0.01, Math.min(0.99, decimal));
  return {
    yes_pool: +(totalLiquidity * (1 - clamped)).toFixed(2),
    no_pool: +(totalLiquidity * clamped).toFixed(2),
  };
}

async function main() {
  // 1. Get all Kalshi-synced markets
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id, question, kalshi_ticker, yes_pool, no_pool, resolved")
    .not("kalshi_ticker", "is", null)
    .eq("resolved", false);

  if (error) {
    console.error("Failed to fetch markets:", error.message);
    process.exit(1);
  }

  // 2. Find markets that still have default 50/50 pools (no trades yet)
  const defaultMarkets = markets.filter(
    (m) => Number(m.yes_pool) === 100 && Number(m.no_pool) === 100,
  );

  console.log(`Found ${markets.length} Kalshi markets, ${defaultMarkets.length} still at 50/50 defaults\n`);

  if (defaultMarkets.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  // 3. Fetch current Kalshi events to get prices
  console.log("Fetching current prices from Kalshi...");
  const res = await fetch(
    `${KALSHI_API_BASE}/events?status=open&with_nested_markets=true&limit=200`,
  );
  if (!res.ok) {
    console.error(`Kalshi API error: ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  const events = data.events ?? [];

  // Build ticker → price map
  const priceMap = new Map<string, number>();
  for (const event of events) {
    const market = event.markets?.[0];
    if (!market) continue;
    const price = market.last_price ?? market.yes_bid;
    if (price != null) {
      priceMap.set(event.event_ticker, price);
    }
  }

  console.log(`Got prices for ${priceMap.size} events\n`);

  // 4. Update markets
  let updated = 0;
  for (const market of defaultMarkets) {
    const price = priceMap.get(market.kalshi_ticker);
    if (price == null) {
      console.log(`  SKIP: ${market.kalshi_ticker} — no Kalshi price found`);
      continue;
    }

    const pools = poolsFromPrice(price);
    const { error: updateErr } = await supabase
      .from("markets")
      .update({ yes_pool: pools.yes_pool, no_pool: pools.no_pool })
      .eq("id", market.id);

    if (updateErr) {
      console.log(`  ERR:  ${market.kalshi_ticker} — ${updateErr.message}`);
    } else {
      updated++;
      const pct = price > 1 ? Math.round(price) : Math.round(price * 100);
      console.log(`  OK:   ${market.question.slice(0, 50)}... → ${pct}% YES`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${defaultMarkets.length} markets.`);
}

main();
