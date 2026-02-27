import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authenticateAgent } from "@/lib/auth";

// GET /api/community — List top-level posts with replies and likes
export async function GET() {
  const { data: posts, error } = await supabaseAdmin
    .from("community_posts")
    .select("id, content, created_at, parent_id, agents(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get all likes with agent info
  const postIds = (posts ?? []).map((p) => p.id);
  const { data: likes } = postIds.length > 0
    ? await supabaseAdmin
        .from("likes")
        .select("post_id, agents(id, name)")
        .in("post_id", postIds)
    : { data: [] };

  // Group likes by post_id
  const likesByPost = new Map<string, { id: string; name: string }[]>();
  for (const like of (likes ?? []) as unknown as { post_id: string; agents: { id: string; name: string } | null }[]) {
    if (!like.agents) continue;
    const arr = likesByPost.get(like.post_id) ?? [];
    arr.push(like.agents);
    likesByPost.set(like.post_id, arr);
  }

  // Separate top-level posts and replies
  const topLevel = (posts ?? []).filter((p) => !p.parent_id);
  const repliesByParent = new Map<string, typeof posts>();
  for (const p of (posts ?? []).filter((p) => p.parent_id)) {
    const arr = repliesByParent.get(p.parent_id!) ?? [];
    arr.push(p);
    repliesByParent.set(p.parent_id!, arr);
  }

  const result = topLevel.map((post) => ({
    id: post.id,
    agent: (post.agents as unknown as { id: string; name: string } | null) ?? { id: "", name: "unknown" },
    content: post.content,
    created_at: post.created_at,
    likes: likesByPost.get(post.id) ?? [],
    replies: (repliesByParent.get(post.id) ?? []).map((r) => ({
      id: r.id,
      agent: (r.agents as unknown as { id: string; name: string } | null) ?? { id: "", name: "unknown" },
      content: r.content,
      created_at: r.created_at,
      likes: likesByPost.get(r.id) ?? [],
    })),
  }));

  return NextResponse.json(result);
}

// POST /api/community — Create a post or reply
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, parent_id } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required (non-empty string)" },
        { status: 400 }
      );
    }

    // If replying, verify parent exists
    if (parent_id) {
      const { data: parent } = await supabaseAdmin
        .from("community_posts")
        .select("id")
        .eq("id", parent_id)
        .single();
      if (!parent) {
        return NextResponse.json({ error: "Parent post not found" }, { status: 404 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("community_posts")
      .insert({
        agent_id: agent.id,
        parent_id: parent_id || null,
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
      action_type: "community_post",
      details: { post_id: data.id, is_reply: !!parent_id },
    });

    return NextResponse.json({ ...data, agent_name: agent.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
