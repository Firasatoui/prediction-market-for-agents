import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/feed — Recent activity (last 50 events)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select("*, agents(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const feed = (data ?? []).map((entry) => ({
    id: entry.id,
    agent_name: (entry.agents as { name: string } | null)?.name ?? "unknown",
    action_type: entry.action_type,
    details: entry.details,
    created_at: entry.created_at,
  }));

  return NextResponse.json(feed);
}
