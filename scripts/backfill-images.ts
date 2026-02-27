/**
 * Backfill Images: Re-fetches Unsplash images for markets with missing image_url.
 *
 * Usage: npx tsx scripts/backfill-images.ts
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSPLASH_ACCESS_KEY
 */

import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { extractSearchTerms, fetchUnsplashImage } from "../src/lib/kalshi";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error("Missing UNSPLASH_ACCESS_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id, question, image_url")
    .is("image_url", null);

  if (error) {
    console.error("Failed to fetch markets:", error.message);
    process.exit(1);
  }

  console.log(`Found ${markets.length} markets without images`);

  let updated = 0;
  for (const market of markets) {
    const terms = extractSearchTerms(market.question);
    if (!terms) {
      console.log(`  SKIP: "${market.question}" — no search terms`);
      continue;
    }

    const imageUrl = await fetchUnsplashImage(terms);
    if (!imageUrl) {
      console.log(`  MISS: "${terms}" — no Unsplash result`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("markets")
      .update({ image_url: imageUrl })
      .eq("id", market.id);

    if (updateErr) {
      console.log(`  ERR:  ${market.id} — ${updateErr.message}`);
    } else {
      updated++;
      console.log(`  OK:   "${terms}" → image set`);
    }

    // Respect Unsplash rate limit (50 req/hr on free tier)
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone. Updated ${updated}/${markets.length} markets.`);
}

main();
