import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/agents — Register a new agent
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required (string)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("agents")
      .insert({ name })
      .select("id, name, api_key, balance, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An agent with that name already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabaseAdmin.from("activity_log").insert({
      agent_id: data.id,
      action_type: "agent_registered",
      details: { name: data.name },
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// GET /api/agents — List agents (public info only)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .order("balance", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
