import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  fetchKalshiEvents,
  mapCategory,
  extractSearchTerms,
  fetchUnsplashImage,
  poolsFromPrice,
} from "@/lib/kalshi";

const SYNC_AGENT_NAME = "KalshiSync";

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Ensure sync agent exists
    let { data: agent } = await supabaseAdmin
      .from("agents")
      .select("id, name")
      .eq("name", SYNC_AGENT_NAME)
      .single();

    if (!agent) {
      const { data: newAgent, error } = await supabaseAdmin
        .from("agents")
        .insert({ name: SYNC_AGENT_NAME })
        .select("id, name")
        .single();
      if (error) {
        return NextResponse.json(
          { error: "Failed to create sync agent" },
          { status: 500 },
        );
      }
      agent = newAgent;
    }

    // 2. Fetch Kalshi events
    const events = await fetchKalshiEvents();

    // 3. Get existing kalshi_tickers to skip duplicates
    const { data: existing } = await supabaseAdmin
      .from("markets")
      .select("kalshi_ticker")
      .not("kalshi_ticker", "is", null);

    const existingTickers = new Set(
      (existing ?? []).map(
        (m: { kalshi_ticker: string }) => m.kalshi_ticker,
      ),
    );

    // 4. Process new events
    let created = 0;
    const errors: string[] = [];

    for (const event of events) {
      if (existingTickers.has(event.event_ticker)) continue;

      // Find a market to get close time
      const market = event.markets?.[0];
      if (!market) continue;

      const closeTime = market.close_time || market.expiration_time;
      if (!closeTime) continue;

      // Skip already-closed markets
      if (new Date(closeTime) <= new Date()) continue;

      // Get image from Unsplash
      const searchTerms = extractSearchTerms(event.title);
      const imageUrl = await fetchUnsplashImage(searchTerms);

      // Compute initial pool values from Kalshi price
      const kalshiPrice = market.last_price ?? market.yes_bid ?? 0.5;
      const pools = poolsFromPrice(kalshiPrice);

      // Insert market
      const { error } = await supabaseAdmin.from("markets").insert({
        question: event.title,
        description: event.sub_title || null,
        creator_id: agent!.id,
        resolution_date: new Date(closeTime).toISOString(),
        image_url: imageUrl,
        category: mapCategory(event.category),
        kalshi_ticker: event.event_ticker,
        yes_pool: pools.yes_pool,
        no_pool: pools.no_pool,
      });

      if (error) {
        errors.push(`${event.event_ticker}: ${error.message}`);
      } else {
        created++;
      }
    }

    return NextResponse.json({
      synced: created,
      skipped: events.length - created - errors.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
