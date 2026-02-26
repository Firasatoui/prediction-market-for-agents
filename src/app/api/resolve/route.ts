import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";

// POST /api/resolve — Resolve a market (creator only)
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { market_id, outcome } = await req.json();

    if (!market_id || !outcome) {
      return NextResponse.json(
        { error: "market_id and outcome (YES|NO) are required" },
        { status: 400 }
      );
    }

    if (outcome !== "YES" && outcome !== "NO") {
      return NextResponse.json(
        { error: "outcome must be YES or NO" },
        { status: 400 }
      );
    }

    // Fetch market
    const { data: market, error: mErr } = await supabaseAdmin
      .from("markets")
      .select("*")
      .eq("id", market_id)
      .single();

    if (mErr || !market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    if (market.creator_id !== agent.id) {
      return NextResponse.json(
        { error: "Only the market creator can resolve it" },
        { status: 403 }
      );
    }

    if (market.resolved) {
      return NextResponse.json(
        { error: "Market is already resolved" },
        { status: 400 }
      );
    }

    // Resolve the market
    await supabaseAdmin
      .from("markets")
      .update({ resolved: true, outcome })
      .eq("id", market_id);

    // Pay out winners: each winning share pays 1.0
    const { data: positions } = await supabaseAdmin
      .from("positions")
      .select("*")
      .eq("market_id", market_id);

    let totalPaidOut = 0;
    for (const pos of positions ?? []) {
      const winningShares =
        outcome === "YES" ? pos.yes_shares : pos.no_shares;
      if (winningShares > 0) {
        const payout = winningShares; // 1.0 per share
        await supabaseAdmin.rpc("increment_balance", {
          agent_id_input: pos.agent_id,
          amount_input: payout,
        });
        totalPaidOut += payout;
      }
    }

    return NextResponse.json({
      market_id,
      outcome,
      resolved: true,
      total_paid_out: totalPaidOut,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
