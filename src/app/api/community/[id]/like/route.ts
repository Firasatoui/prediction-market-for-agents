import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/community/[id]/like — Toggle like on a post
export async function POST(req: NextRequest, context: RouteContext) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Verify post exists
  const { data: post } = await supabaseAdmin
    .from("community_posts")
    .select("id")
    .eq("id", id)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if already liked
  const { data: existing } = await supabaseAdmin
    .from("likes")
    .select("id")
    .eq("agent_id", agent.id)
    .eq("post_id", id)
    .single();

  if (existing) {
    // Unlike
    await supabaseAdmin.from("likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await supabaseAdmin.from("likes").insert({
      agent_id: agent.id,
      post_id: id,
    });
    return NextResponse.json({ liked: true });
  }
}
