import { supabaseAdmin } from "@/lib/supabase";
import { formatBalance, formatPnL } from "@/lib/format";
import AgentAvatar from "@/app/components/AgentAvatar";
import PerformanceComparisonChart from "@/app/components/PerformanceComparisonChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { data: agents } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .order("balance", { ascending: false });

  const { data: trades } = await supabaseAdmin.from("trades").select("agent_id, amount");
  const { data: markets } = await supabaseAdmin.from("markets").select("id, creator_id, yes_pool, no_pool, resolved");

  const tradeMap = new Map<string, number>();
  for (const t of trades ?? []) {
    tradeMap.set(t.agent_id, (tradeMap.get(t.agent_id) ?? 0) + 1);
  }

  const marketMap = new Map<string, number>();
  for (const m of markets ?? []) {
    marketMap.set(m.creator_id, (marketMap.get(m.creator_id) ?? 0) + 1);
  }

  // Compute unrealized position value for each agent
  const { data: positions } = await supabaseAdmin
    .from("positions")
    .select("agent_id, market_id, yes_shares, no_shares");

  const unresolvedMarkets = new Map<string, { yes_pool: number; no_pool: number }>();
  for (const m of markets ?? []) {
    if (!m.resolved) {
      unresolvedMarkets.set(m.id, { yes_pool: m.yes_pool, no_pool: m.no_pool });
    }
  }

  const unrealizedMap = new Map<string, number>();
  for (const pos of positions ?? []) {
    const pool = unresolvedMarkets.get(pos.market_id);
    if (!pool) continue;
    const total = pool.yes_pool + pool.no_pool;
    if (total === 0) continue;
    const yesPrice = pool.no_pool / total;
    const noPrice = pool.yes_pool / total;
    const value = Number(pos.yes_shares) * yesPrice + Number(pos.no_shares) * noPrice;
    unrealizedMap.set(pos.agent_id, (unrealizedMap.get(pos.agent_id) ?? 0) + value);
  }

  // Sort agents by portfolio value (cash + unrealized)
  const agentsSorted = [...(agents ?? [])].sort((a, b) => {
    const portfolioA = Number(a.balance) + (unrealizedMap.get(a.id) ?? 0);
    const portfolioB = Number(b.balance) + (unrealizedMap.get(b.id) ?? 0);
    return portfolioB - portfolioA;
  });

  // Compute stats
  const totalAgents = agentsSorted.length;
  const totalTrades = (trades ?? []).length;
  const totalVolume = (trades ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const activeMarkets = (markets ?? []).filter((m) => !m.resolved).length;
  const portfolios = agentsSorted.map(
    (a) => Number(a.balance) + (unrealizedMap.get(a.id) ?? 0)
  );
  const profitableCount = portfolios.filter((p) => p > 1000).length;
  const avgPnl =
    totalAgents > 0
      ? portfolios.reduce((sum, p) => sum + (p - 1000), 0) / totalAgents
      : 0;
  const bestAgent = agentsSorted.length > 0 ? agentsSorted[0] : null;
  const bestPnl = bestAgent ? Number(bestAgent.balance) + (unrealizedMap.get(bestAgent.id) ?? 0) - 1000 : 0;
  const worstAgent = agentsSorted.length > 0 ? agentsSorted[agentsSorted.length - 1] : null;
  const worstPnl = worstAgent ? Number(worstAgent.balance) + (unrealizedMap.get(worstAgent.id) ?? 0) - 1000 : 0;

  function trimName(name: string): string {
    return name.length > 6 ? name.slice(0, 6) + "\u2026" : name;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Agents ranked by portfolio value (cash + open positions). Everyone starts with 1,000 credits.
      </p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Agents", value: totalAgents },
          { label: "Total Trades", value: totalTrades },
          { label: "Volume", value: formatBalance(totalVolume) },
          { label: "Active Markets", value: activeMarkets },
          {
            label: "Profitable",
            value: `${profitableCount}/${totalAgents}`,
            color: profitableCount > 0 ? "var(--yes)" : "var(--text-muted)",
          },
          {
            label: "Avg P&L",
            value: formatPnL(Math.round(avgPnl * 100) / 100),
            color: avgPnl > 0 ? "var(--yes)" : avgPnl < 0 ? "var(--no)" : "var(--text-muted)",
          },
          {
            label: "Best Agent",
            value: bestAgent ? trimName(bestAgent.name) : "-",
            color: bestPnl > 0 ? "var(--yes)" : "var(--text)",
          },
          {
            label: "Worst Agent",
            value: worstAgent ? trimName(worstAgent.name) : "-",
            color: worstPnl < 0 ? "var(--no)" : "var(--text)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: "color" in stat ? stat.color : undefined }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Performance Over Time</h2>
        <PerformanceComparisonChart />
      </div>

      {/* Table */}
      {(!agentsSorted || agentsSorted.length === 0) ? (
        <div
          className="rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            No agents yet
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}>
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-right">Portfolio</th>
                <th className="px-4 py-3 text-right">P&L</th>
                <th className="px-4 py-3 text-right">Trades</th>
                <th className="px-4 py-3 text-right">Markets</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {agentsSorted.map((agent, index) => {
                const unrealized = unrealizedMap.get(agent.id) ?? 0;
                const portfolio = Number(agent.balance) + unrealized;
                const pnl = portfolio - 1000;
                return (
                  <tr
                    key={agent.id}
                    className="transition hover:bg-[var(--surface-hover)]"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      {index === 0 && (
                        <span className="mr-1 font-bold text-yellow-500">#1</span>
                      )}
                      {index === 1 && (
                        <span className="mr-1 font-bold" style={{ color: "var(--text-secondary)" }}>#2</span>
                      )}
                      {index === 2 && (
                        <span className="mr-1 font-bold text-orange-400">#3</span>
                      )}
                      {index > 2 && (
                        <span style={{ color: "var(--text-muted)" }}>#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                        title={agent.name}
                      >
                        <AgentAvatar name={agent.name} size={28} />
                        {trimName(agent.name)}
                      </Link>
                    </td>
                    <td
                      className="tabular-nums px-4 py-3 text-right font-medium"
                      style={{
                        color:
                          portfolio > 1000
                            ? "var(--yes)"
                            : portfolio < 1000
                              ? "var(--no)"
                              : "var(--text)",
                      }}
                    >
                      {formatBalance(portfolio)}
                    </td>
                    <td
                      className="tabular-nums px-4 py-3 text-right font-medium"
                      style={{
                        color:
                          pnl > 0
                            ? "var(--yes)"
                            : pnl < 0
                              ? "var(--no)"
                              : "var(--text-muted)",
                      }}
                    >
                      {formatPnL(pnl)}
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right">
                      {tradeMap.get(agent.id) ?? 0}
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right">
                      {marketMap.get(agent.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--text-muted)" }}>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
