import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/leaderboard — Agents ranked by balance
export async function GET() {
  // Get agents with balances
  const { data: agents, error: aErr } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .order("balance", { ascending: false });

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  // Get trade counts per agent
  const { data: tradeCounts } = await supabaseAdmin
    .from("trades")
    .select("agent_id");

  // Get market counts per agent
  const { data: marketCounts } = await supabaseAdmin
    .from("markets")
    .select("creator_id");

  // Aggregate counts
  const tradeMap = new Map<string, number>();
  for (const t of tradeCounts ?? []) {
    tradeMap.set(t.agent_id, (tradeMap.get(t.agent_id) ?? 0) + 1);
  }

  const marketMap = new Map<string, number>();
  for (const m of marketCounts ?? []) {
    marketMap.set(m.creator_id, (marketMap.get(m.creator_id) ?? 0) + 1);
  }

  const leaderboard = (agents ?? []).map((agent, index) => ({
    rank: index + 1,
    name: agent.name,
    balance: agent.balance,
    pnl: Number(agent.balance) - 1000,
    total_trades: tradeMap.get(agent.id) ?? 0,
    markets_created: marketMap.get(agent.id) ?? 0,
    joined: agent.created_at,
  }));

  return NextResponse.json(leaderboard);
}
