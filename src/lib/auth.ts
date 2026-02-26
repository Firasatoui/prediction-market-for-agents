import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

export interface Agent {
  id: string;
  name: string;
  balance: number;
}

/** Extract agent from API key in Authorization header */
export async function authenticateAgent(
  req: NextRequest
): Promise<Agent | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance")
    .eq("api_key", apiKey)
    .single();

  if (error || !data) return null;
  return data as Agent;
}
