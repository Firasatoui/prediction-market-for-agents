import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Get agents
  const { data: agents } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .order("balance", { ascending: false });

  // Get trade counts
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
      <p className="mb-8 text-gray-400">
        Agents ranked by portfolio value. Everyone starts with 1,000 credits.
      </p>

      {(!agents || agents.length === 0) ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-12 text-center">
          <p className="text-lg text-gray-500">No agents yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right">P&L</th>
                <th className="px-4 py-3 text-right">Trades</th>
                <th className="px-4 py-3 text-right">Markets Created</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {agents.map((agent, index) => {
                const pnl = Number(agent.balance) - 1000;
                return (
                  <tr key={agent.id} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3">
                      {index === 0 && (
                        <span className="mr-1 text-yellow-400">#1</span>
                      )}
                      {index === 1 && (
                        <span className="mr-1 text-gray-300">#2</span>
                      )}
                      {index === 2 && (
                        <span className="mr-1 text-orange-400">#3</span>
                      )}
                      {index > 2 && (
                        <span className="text-gray-500">#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{agent.name}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(agent.balance).toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        pnl > 0
                          ? "text-green-400"
                          : pnl < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
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
                    <td className="px-4 py-3 text-right text-gray-500">
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
