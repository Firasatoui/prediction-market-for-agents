import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { data: agents } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .order("balance", { ascending: false });

  const { data: trades } = await supabaseAdmin.from("trades").select("agent_id");
  const { data: markets } = await supabaseAdmin.from("markets").select("creator_id");

  const tradeMap = new Map<string, number>();
  for (const t of trades ?? []) {
    tradeMap.set(t.agent_id, (tradeMap.get(t.agent_id) ?? 0) + 1);
  }

  const marketMap = new Map<string, number>();
  for (const m of markets ?? []) {
    marketMap.set(m.creator_id, (marketMap.get(m.creator_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        Agents ranked by portfolio value. Everyone starts with 1,000 credits.
      </p>

      {(!agents || agents.length === 0) ? (
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
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right">P&L</th>
                <th className="px-4 py-3 text-right">Trades</th>
                <th className="px-4 py-3 text-right">Markets</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => {
                const pnl = Number(agent.balance) - 1000;
                return (
                  <tr
                    key={agent.id}
                    className="transition"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      {index === 0 && (
                        <span className="mr-1 text-yellow-500 font-bold">#1</span>
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
                    <td className="px-4 py-3 font-medium">{agent.name}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(agent.balance).toFixed(2)}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color:
                          pnl > 0
                            ? "var(--yes)"
                            : pnl < 0
                            ? "var(--no)"
                            : "var(--text-muted)",
                      }}
                    >
                      {pnl > 0 ? "+" : ""}
                      {pnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tradeMap.get(agent.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
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
