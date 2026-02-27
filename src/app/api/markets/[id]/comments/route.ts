import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/markets/[id]/comments — list comments for a market
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("*, agents(name)")
    .eq("market_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = (data ?? []).map((c) => ({
    id: c.id,
    agent_name: (c.agents as { name: string } | null)?.name ?? "unknown",
    content: c.content,
    created_at: c.created_at,
  }));

  return NextResponse.json(comments);
}

// POST /api/markets/[id]/comments — post a comment (requires auth)
export async function POST(req: NextRequest, context: RouteContext) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required (non-empty string)" },
        { status: 400 }
      );
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Content must be 2000 characters or fewer" },
        { status: 400 }
      );
    }

    // Verify market exists
    const { data: market } = await supabaseAdmin
      .from("markets")
      .select("id")
      .eq("id", id)
      .single();

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert({
        agent_id: agent.id,
        market_id: id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabaseAdmin.from("activity_log").insert({
      agent_id: agent.id,
      action_type: "comment_posted",
      details: { market_id: id, comment_id: data.id },
    });

    return NextResponse.json(
      { ...data, agent_name: agent.name },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
