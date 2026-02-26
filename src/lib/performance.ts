import { supabaseAdmin } from "@/lib/supabase";

export interface BalancePoint {
  timestamp: string;
  balance: number;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  current_balance: number;
  data_points: BalancePoint[];
}

export async function computeAgentPerformance(
  agentId: string
): Promise<AgentPerformance | null> {
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .eq("id", agentId)
    .single();

  if (!agent) return null;

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("amount, shares_received, side, market_id, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  // Get positions for this agent to check resolved payouts
  const { data: positions } = await supabaseAdmin
    .from("positions")
    .select("market_id, yes_shares, no_shares")
    .eq("agent_id", agentId);

  // Get resolution events from activity_log
  const { data: resolutionEvents } = await supabaseAdmin
    .from("activity_log")
    .select("details, created_at")
    .eq("action_type", "market_resolved")
    .order("created_at", { ascending: true });

  // Build resolution map: market_id -> { outcome, resolved_at }
  const resolutionMap = new Map<
    string,
    { outcome: string; resolved_at: string }
  >();
  for (const event of resolutionEvents ?? []) {
    const details = event.details as {
      market_id?: string;
      outcome?: string;
    };
    if (details?.market_id && details?.outcome) {
      resolutionMap.set(details.market_id, {
        outcome: details.outcome,
        resolved_at: event.created_at,
      });
    }
  }

  interface TimelineEvent {
    timestamp: string;
    balanceChange: number;
  }

  const timeline: TimelineEvent[] = [];

  // Add trades (spending money)
  for (const trade of trades ?? []) {
    timeline.push({
      timestamp: trade.created_at,
      balanceChange: -Number(trade.amount),
    });
  }

  // Add payouts from resolved markets
  const agentMarketIds = new Set((positions ?? []).map((p) => p.market_id));
  for (const [marketId, resolution] of resolutionMap) {
    if (!agentMarketIds.has(marketId)) continue;
    const pos = (positions ?? []).find((p) => p.market_id === marketId);
    if (!pos) continue;
    const winningShares =
      resolution.outcome === "YES"
        ? Number(pos.yes_shares)
        : Number(pos.no_shares);
    if (winningShares > 0) {
      timeline.push({
        timestamp: resolution.resolved_at,
        balanceChange: winningShares,
      });
    }
  }

  // Sort by timestamp
  timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Build data points
  const dataPoints: BalancePoint[] = [];
  let runningBalance = 1000;

  dataPoints.push({ timestamp: agent.created_at, balance: 1000 });

  for (const event of timeline) {
    runningBalance += event.balanceChange;
    dataPoints.push({
      timestamp: event.timestamp,
      balance: Math.round(runningBalance * 100) / 100,
    });
  }

  return {
    agent_id: agent.id,
    agent_name: agent.name,
    current_balance: Number(agent.balance),
    data_points: dataPoints,
  };
}

export async function computeAllPerformance(): Promise<AgentPerformance[]> {
  const { data: agents } = await supabaseAdmin
    .from("agents")
    .select("id")
    .order("created_at", { ascending: true });

  if (!agents || agents.length === 0) return [];

  const results: AgentPerformance[] = [];
  for (const agent of agents) {
    const perf = await computeAgentPerformance(agent.id);
    if (perf) results.push(perf);
  }

  return results;
}
