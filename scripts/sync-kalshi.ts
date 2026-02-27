/**
 * Kalshi Sync Script: Pulls open events from Kalshi and inserts them as markets.
 *
 * Usage: npm run sync-kalshi
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - The `kalshi_ticker` column must exist on the markets table.
 *     If missing, run: supabase/add-kalshi-ticker.sql
 *   - Optional: UNSPLASH_ACCESS_KEY in .env.local for market images
 */

import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SYNC_AGENT_NAME = "KalshiSync";
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

const CATEGORY_MAP: Record<string, string> = {
  Politics: "Politics",
  Economics: "Economics",
  Financial: "Economics",
  "Climate and Weather": "Climate",
  Climate: "Climate",
  Tech: "Tech",
  Science: "Tech",
  Sports: "Sports",
  Culture: "Entertainment",
  Entertainment: "Entertainment",
  Companies: "Companies",
  World: "World",
};

const STOP_WORDS = new Set([
  "will", "the", "a", "an", "by", "in", "before", "after", "be", "of",
  "to", "at", "any", "is", "it", "on", "for", "or", "and", "than",
  "has", "have", "does", "do", "this", "that", "with", "from",
]);

function mapCategory(kalshiCategory: string): string {
  return CATEGORY_MAP[kalshiCategory] ?? "World";
}

function extractSearchTerms(question: string): string {
  return question
    .replace(/[?!.,]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 4)
    .join(" ");
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

interface KalshiMarket {
  ticker: string;
  close_time: string;
  expiration_time: string;
  status: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  sub_title: string;
  category: string;
  markets?: KalshiMarket[];
}

async function main() {
  console.log("--- Kalshi Sync ---\n");

  // 1. Run migration (idempotent)
  console.log("1. Running migration (add kalshi_ticker column)...");
  const { error: migrationError } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE markets ADD COLUMN IF NOT EXISTS kalshi_ticker text UNIQUE;",
  });
  if (migrationError) {
    // RPC may not exist — try direct column check instead
    console.log(
      "   Note: RPC not available, assuming column exists (run supabase/add-kalshi-ticker.sql manually if not).",
    );
  } else {
    console.log("   Migration applied.");
  }

  // 2. Ensure sync agent exists
  console.log("2. Ensuring KalshiSync agent exists...");
  let { data: agent } = await supabase
    .from("agents")
    .select("id, name")
    .eq("name", SYNC_AGENT_NAME)
    .single();

  if (!agent) {
    const { data: newAgent, error } = await supabase
      .from("agents")
      .insert({ name: SYNC_AGENT_NAME })
      .select("id, name")
      .single();
    if (error) {
      console.error("   Failed to create sync agent:", error.message);
      process.exit(1);
    }
    agent = newAgent;
    console.log(`   Created agent: ${agent!.name} (${agent!.id})`);
  } else {
    console.log(`   Found agent: ${agent.name} (${agent.id})`);
  }

  // 3. Fetch Kalshi events
  console.log("3. Fetching events from Kalshi API...");
  let events: KalshiEvent[];
  try {
    const res = await fetch(
      `${KALSHI_API_BASE}/events?status=open&with_nested_markets=true&limit=50`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    events = data.events ?? [];
    console.log(`   Fetched ${events.length} events.`);
  } catch (err) {
    console.error(
      "   Failed to fetch Kalshi events:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }

  // 4. Get existing tickers for deduplication
  const { data: existing } = await supabase
    .from("markets")
    .select("kalshi_ticker")
    .not("kalshi_ticker", "is", null);

  const existingTickers = new Set(
    (existing ?? []).map(
      (m: { kalshi_ticker: string }) => m.kalshi_ticker,
    ),
  );
  console.log(`   ${existingTickers.size} existing Kalshi markets in DB.\n`);

  // 5. Process events
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;

  if (!hasUnsplash) {
    console.log(
      "   Note: No UNSPLASH_ACCESS_KEY set — markets will use category fallback images.\n",
    );
  }

  for (const event of events) {
    if (existingTickers.has(event.event_ticker)) {
      skipped++;
      continue;
    }

    const market = event.markets?.[0];
    if (!market) {
      skipped++;
      continue;
    }

    const closeTime = market.close_time || market.expiration_time;
    if (!closeTime || new Date(closeTime) <= new Date()) {
      skipped++;
      continue;
    }

    // Fetch image
    let imageUrl: string | null = null;
    if (hasUnsplash) {
      const searchTerms = extractSearchTerms(event.title);
      imageUrl = await fetchUnsplashImage(searchTerms);
    }

    const { error } = await supabase.from("markets").insert({
      question: event.title,
      description: event.sub_title || null,
      creator_id: agent!.id,
      resolution_date: new Date(closeTime).toISOString(),
      image_url: imageUrl,
      category: mapCategory(event.category),
      kalshi_ticker: event.event_ticker,
    });

    if (error) {
      errors.push(`${event.event_ticker}: ${error.message}`);
      console.log(`   X  ${event.title} — ${error.message}`);
    } else {
      created++;
      console.log(`   +  ${event.title}`);
    }
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors:  ${errors.length}`);
  if (errors.length > 0) {
    console.log("\n   Error details:");
    errors.forEach((e) => console.log(`     - ${e}`));
  }
  console.log("\nDone!");
}

main();
