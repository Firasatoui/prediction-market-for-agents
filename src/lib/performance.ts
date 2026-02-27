import { supabaseAdmin } from "@/lib/supabase";
import { getPositionValue } from "@/lib/market-maker";

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

  // Add unrealized position value from unresolved markets as final "now" point
  const { data: unresolvedMarkets } = await supabaseAdmin
    .from("markets")
    .select("id, yes_pool, no_pool")
    .eq("resolved", false);

  const unresolvedPoolMap = new Map<string, { yes_pool: number; no_pool: number }>();
  for (const m of unresolvedMarkets ?? []) {
    unresolvedPoolMap.set(m.id, { yes_pool: m.yes_pool, no_pool: m.no_pool });
  }

  let unrealizedValue = 0;
  for (const pos of positions ?? []) {
    const pool = unresolvedPoolMap.get(pos.market_id);
    if (!pool) continue;
    unrealizedValue += getPositionValue(pool, Number(pos.yes_shares), Number(pos.no_shares));
  }

  if (unrealizedValue > 0) {
    const portfolioBalance = Math.round((runningBalance + unrealizedValue) * 100) / 100;
    dataPoints.push({
      timestamp: new Date().toISOString(),
      balance: portfolioBalance,
    });
  }

  return {
    agent_id: agent.id,
    agent_name: agent.name,
    current_balance: Number(agent.balance) + unrealizedValue,
    data_points: dataPoints,
  };
}

export async function computeAllPerformance(): Promise<AgentPerformance[]> {
  // Batch all DB queries upfront (5 queries instead of 5 * N agents)
  const [
    { data: agents },
    { data: allTrades },
    { data: allPositions },
    { data: allResolutionEvents },
    { data: allUnresolvedMarkets },
  ] = await Promise.all([
    supabaseAdmin
      .from("agents")
      .select("id, name, balance, created_at")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("trades")
      .select("agent_id, amount, shares_received, side, market_id, created_at")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("positions")
      .select("agent_id, market_id, yes_shares, no_shares"),
    supabaseAdmin
      .from("activity_log")
      .select("details, created_at")
      .eq("action_type", "market_resolved")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("markets")
      .select("id, yes_pool, no_pool")
      .eq("resolved", false),
  ]);

  if (!agents || agents.length === 0) return [];

  // Build shared lookups once
  const resolutionMap = new Map<string, { outcome: string; resolved_at: string }>();
  for (const event of allResolutionEvents ?? []) {
    const details = event.details as { market_id?: string; outcome?: string };
    if (details?.market_id && details?.outcome) {
      resolutionMap.set(details.market_id, {
        outcome: details.outcome,
        resolved_at: event.created_at,
      });
    }
  }

  const unresolvedPoolMap = new Map<string, { yes_pool: number; no_pool: number }>();
  for (const m of allUnresolvedMarkets ?? []) {
    unresolvedPoolMap.set(m.id, { yes_pool: m.yes_pool, no_pool: m.no_pool });
  }

  // Group trades and positions by agent_id
  const tradesByAgent = new Map<string, typeof allTrades>();
  for (const t of allTrades ?? []) {
    const arr = tradesByAgent.get(t.agent_id) ?? [];
    arr.push(t);
    tradesByAgent.set(t.agent_id, arr);
  }

  const positionsByAgent = new Map<string, typeof allPositions>();
  for (const p of allPositions ?? []) {
    const arr = positionsByAgent.get(p.agent_id) ?? [];
    arr.push(p);
    positionsByAgent.set(p.agent_id, arr);
  }

  // Compute performance per agent in-memory
  const results: AgentPerformance[] = [];
  for (const agent of agents) {
    const trades = tradesByAgent.get(agent.id) ?? [];
    const positions = positionsByAgent.get(agent.id) ?? [];

    interface TimelineEvent {
      timestamp: string;
      balanceChange: number;
    }
    const timeline: TimelineEvent[] = [];

    for (const trade of trades) {
      timeline.push({
        timestamp: trade.created_at,
        balanceChange: -Number(trade.amount),
      });
    }

    const agentMarketIds = new Set(positions.map((p) => p.market_id));
    for (const [marketId, resolution] of resolutionMap) {
      if (!agentMarketIds.has(marketId)) continue;
      const pos = positions.find((p) => p.market_id === marketId);
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

    timeline.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

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

    // Add unrealized position value as final "now" point
    let unrealizedValue = 0;
    for (const pos of positions) {
      const pool = unresolvedPoolMap.get(pos.market_id);
      if (!pool) continue;
      unrealizedValue += getPositionValue(pool, Number(pos.yes_shares), Number(pos.no_shares));
    }

    if (unrealizedValue > 0) {
      dataPoints.push({
        timestamp: new Date().toISOString(),
        balance: Math.round((runningBalance + unrealizedValue) * 100) / 100,
      });
    }

    results.push({
      agent_id: agent.id,
      agent_name: agent.name,
      current_balance: Number(agent.balance) + unrealizedValue,
      data_points: dataPoints,
    });
  }

  return results;
}
