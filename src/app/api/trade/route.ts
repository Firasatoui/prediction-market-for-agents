import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";
import { buyYes, buyNo } from "@/lib/market-maker";

// POST /api/trade — Buy YES or NO shares
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { market_id, side, amount } = await req.json();

    if (!market_id || !side || !amount) {
      return NextResponse.json(
        { error: "market_id, side (YES|NO), and amount are required" },
        { status: 400 }
      );
    }

    if (side !== "YES" && side !== "NO") {
      return NextResponse.json(
        { error: "side must be YES or NO" },
        { status: 400 }
      );
    }

    const tradeAmount = Number(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    if (tradeAmount > agent.balance) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${agent.balance}` },
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

    if (market.resolved) {
      return NextResponse.json(
        { error: "Market is already resolved" },
        { status: 400 }
      );
    }

    // Calculate trade
    const pool = { yes_pool: market.yes_pool, no_pool: market.no_pool };
    const result = side === "YES" ? buyYes(pool, tradeAmount) : buyNo(pool, tradeAmount);

    // Execute trade in a pseudo-transaction (update all tables)
    // 1. Update market pools
    const { error: updateErr } = await supabaseAdmin
      .from("markets")
      .update({
        yes_pool: result.new_yes_pool,
        no_pool: result.new_no_pool,
      })
      .eq("id", market_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. Deduct agent balance
    await supabaseAdmin
      .from("agents")
      .update({ balance: agent.balance - tradeAmount })
      .eq("id", agent.id);

    // 3. Record trade
    const { data: trade } = await supabaseAdmin
      .from("trades")
      .insert({
        agent_id: agent.id,
        market_id,
        side,
        amount: tradeAmount,
        shares_received: result.shares_received,
        price_at_trade: result.price_at_trade,
      })
      .select()
      .single();

    // 4. Upsert position
    const { data: existingPos } = await supabaseAdmin
      .from("positions")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("market_id", market_id)
      .single();

    if (existingPos) {
      const update =
        side === "YES"
          ? { yes_shares: existingPos.yes_shares + result.shares_received }
          : { no_shares: existingPos.no_shares + result.shares_received };
      await supabaseAdmin
        .from("positions")
        .update(update)
        .eq("id", existingPos.id);
    } else {
      await supabaseAdmin.from("positions").insert({
        agent_id: agent.id,
        market_id,
        yes_shares: side === "YES" ? result.shares_received : 0,
        no_shares: side === "NO" ? result.shares_received : 0,
      });
    }

    return NextResponse.json({
      trade,
      shares_received: result.shares_received,
      new_balance: agent.balance - tradeAmount,
      new_yes_price:
        result.new_no_pool / (result.new_yes_pool + result.new_no_pool),
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
