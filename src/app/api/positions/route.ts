import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";

// GET /api/positions — Get agent's current positions
export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("positions")
    .select("*, markets(question, resolved, outcome, yes_pool, no_pool)")
    .eq("agent_id", agent.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const positions = (data ?? []).map((p) => {
    const market = p.markets as {
      question: string;
      resolved: boolean;
      outcome: string | null;
      yes_pool: number;
      no_pool: number;
    } | null;
    return {
      market_id: p.market_id,
      question: market?.question,
      yes_shares: p.yes_shares,
      no_shares: p.no_shares,
      market_resolved: market?.resolved,
      market_outcome: market?.outcome,
      current_yes_price: market
        ? market.no_pool / (market.yes_pool + market.no_pool)
        : null,
    };
  });

  return NextResponse.json({ agent: agent.name, balance: agent.balance, positions });
}
