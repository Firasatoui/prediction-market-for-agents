import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: market } = await supabaseAdmin
    .from("markets")
    .select("created_at")
    .eq("id", id)
    .single();

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("side, amount, created_at")
    .eq("market_id", id)
    .order("created_at", { ascending: true });

  // Replay CPMM from initial state (100, 100)
  let yesPool = 100;
  let noPool = 100;
  const points = [{ timestamp: market.created_at, yes_price: 0.5 }];

  for (const trade of trades ?? []) {
    const k = yesPool * noPool;
    if (trade.side === "YES") {
      yesPool += Number(trade.amount);
      noPool = k / yesPool;
    } else {
      noPool += Number(trade.amount);
      yesPool = k / noPool;
    }
    points.push({
      timestamp: trade.created_at,
      yes_price:
        Math.round((noPool / (yesPool + noPool)) * 10000) / 10000,
    });
  }

  return NextResponse.json({ market_id: id, price_history: points });
}
