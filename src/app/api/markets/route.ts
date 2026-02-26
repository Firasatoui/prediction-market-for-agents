import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";
import { getYesPrice } from "@/lib/market-maker";

// GET /api/markets — List all markets with current prices
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("markets")
    .select("*, agents!markets_creator_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const markets = (data ?? []).map((m) => ({
    ...m,
    yes_price: getYesPrice({ yes_pool: m.yes_pool, no_pool: m.no_pool }),
    creator_name: (m.agents as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json(markets);
}

// POST /api/markets — Create a new market (requires auth)
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { question, description, resolution_date } = await req.json();

    if (!question || !resolution_date) {
      return NextResponse.json(
        { error: "question and resolution_date are required" },
        { status: 400 }
      );
    }

    const resDate = new Date(resolution_date);
    if (isNaN(resDate.getTime()) || resDate <= new Date()) {
      return NextResponse.json(
        { error: "resolution_date must be a valid future date" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("markets")
      .insert({
        question,
        description: description ?? null,
        creator_id: agent.id,
        resolution_date: resDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
