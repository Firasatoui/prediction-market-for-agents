import { supabaseAdmin } from "@/lib/supabase";
import { getYesPrice } from "@/lib/market-maker";
import { notFound } from "next/navigation";
import { formatBalance, formatPnL } from "@/lib/format";
import AgentAvatar from "@/app/components/AgentAvatar";
import AgentBalanceChart from "@/app/components/AgentBalanceChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgentProfile({ params }: Props) {
  const { id } = await params;

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("id, name, balance, created_at")
    .eq("id", id)
    .single();

  if (!agent) return notFound();

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("*, markets(question)")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const { data: positions } = await supabaseAdmin
    .from("positions")
    .select("*, markets(question, resolved, outcome, yes_pool, no_pool)")
    .eq("agent_id", id);

  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("*, markets(question)")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const { data: createdMarkets } = await supabaseAdmin
    .from("markets")
    .select("id, question, resolved, outcome, yes_pool, no_pool")
    .eq("creator_id", id);

  // Compute unrealized position value
  const unrealized = (positions ?? []).reduce((sum, p) => {
    const market = p.markets as {
      question: string;
      resolved: boolean;
      outcome: string | null;
      yes_pool: number;
      no_pool: number;
    } | null;
    if (!market || market.resolved) return sum;
    const yesPrice = getYesPrice({ yes_pool: market.yes_pool, no_pool: market.no_pool });
    return sum + Number(p.yes_shares) * yesPrice + Number(p.no_shares) * (1 - yesPrice);
  }, 0);
  const portfolio = Number(agent.balance) + unrealized;
  const pnl = portfolio - 1000;
  const tradeCount = (trades ?? []).length;
  const marketCount = (createdMarkets ?? []).length;

  // Win rate from resolved positions
  let resolvedCount = 0;
  let wonCount = 0;
  for (const p of positions ?? []) {
    const m = p.markets as { resolved: boolean; outcome: string | null } | null;
    if (!m?.resolved) continue;
    resolvedCount++;
    const yesShares = Number(p.yes_shares);
    const noShares = Number(p.no_shares);
    if (
      (m.outcome === "YES" && yesShares > noShares) ||
      (m.outcome === "NO" && noShares > yesShares)
    ) {
      wonCount++;
    }
  }
  const winRate = resolvedCount > 0 ? Math.round((wonCount / resolvedCount) * 100) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main column */}
      <div className="lg:col-span-2">
        {/* Agent header */}
        <div className="mb-6 flex items-center gap-4">
          <AgentAvatar name={agent.name} size={56} />
          <div>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Joined {new Date(agent.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Performance chart */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Performance</h2>
          <AgentBalanceChart agentId={id} />
        </div>

        {/* Investments */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Investments</h2>
          {(positions ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No investments yet
            </p>
          ) : (
            <div className="space-y-3">
              {(positions ?? []).map((p) => {
                const market = p.markets as {
                  question: string;
                  resolved: boolean;
                  outcome: string | null;
                  yes_pool: number;
                  no_pool: number;
                } | null;
                const yesShares = Number(p.yes_shares);
                const noShares = Number(p.no_shares);
                const currentYesPrice = market
                  ? getYesPrice({
                      yes_pool: market.yes_pool,
                      no_pool: market.no_pool,
                    })
                  : 0.5;
                const value =
                  yesShares * currentYesPrice +
                  noShares * (1 - currentYesPrice);

                // Determine status badge
                let badge: { label: string; color: string; bg: string };
                if (!market?.resolved) {
                  badge = { label: "Open", color: "var(--primary-bright)", bg: "rgba(99,102,241,0.12)" };
                } else if (
                  (market.outcome === "YES" && yesShares > noShares) ||
                  (market.outcome === "NO" && noShares > yesShares)
                ) {
                  badge = { label: "Won", color: "var(--yes)", bg: "rgba(0,166,118,0.12)" };
                } else {
                  badge = { label: "Lost", color: "var(--no)", bg: "rgba(229,83,75,0.12)" };
                }

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <Link
                        href={`/markets/${p.market_id}`}
                        className="line-clamp-1 text-sm font-medium hover:underline"
                        style={{ color: "var(--primary-bright)" }}
                      >
                        {market?.question ?? "Unknown"}
                      </Link>
                      <div
                        className="mt-1 flex gap-3 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {yesShares > 0 && (
                          <span>
                            <span style={{ color: "var(--yes)" }}>YES</span>{" "}
                            {yesShares.toFixed(2)} shares
                          </span>
                        )}
                        {noShares > 0 && (
                          <span>
                            <span style={{ color: "var(--no)" }}>NO</span>{" "}
                            {noShares.toFixed(2)} shares
                          </span>
                        )}
                        <span>Value: {formatBalance(value)}</span>
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ color: badge.color, backgroundColor: badge.bg }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trade history */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Trade History</h2>
          {tradeCount === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No trades yet
            </p>
          ) : (
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            >
              <table className="w-full text-sm">
                <thead
                  style={{
                    backgroundColor: "var(--surface)",
                    color: "var(--text-muted)",
                  }}
                >
                  <tr>
                    <th className="px-4 py-2 text-left">Market</th>
                    <th className="px-4 py-2 text-left">Side</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">Shares</th>
                    <th className="px-4 py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(trades ?? []).map((t) => (
                    <tr
                      key={t.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td className="max-w-[200px] truncate px-4 py-2">
                        <Link
                          href={`/markets/${t.market_id}`}
                          className="hover:underline"
                          style={{ color: "var(--primary-bright)" }}
                        >
                          {(t.markets as { question: string } | null)
                            ?.question ?? "Unknown"}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          style={{
                            color:
                              t.side === "YES"
                                ? "var(--yes)"
                                : "var(--no)",
                          }}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="tabular-nums px-4 py-2 text-right">
                        {formatBalance(Number(t.amount))}
                      </td>
                      <td className="tabular-nums px-4 py-2 text-right">
                        {Number(t.shares_received).toFixed(4)}
                      </td>
                      <td
                        className="px-4 py-2 text-right"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Comments */}
        {(comments ?? []).length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Comments</h2>
            <div className="space-y-3">
              {(comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border p-4"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <Link
                      href={`/markets/${c.market_id}`}
                      className="text-sm hover:underline"
                      style={{ color: "var(--primary-bright)" }}
                    >
                      {(c.markets as { question: string } | null)?.question ??
                        "Unknown market"}
                    </Link>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <h3 className="mb-3 font-semibold">Stats</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Portfolio</dt>
              <dd
                className="tabular-nums font-semibold"
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
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Cash</dt>
              <dd className="tabular-nums font-semibold">
                {formatBalance(Number(agent.balance))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>P&L</dt>
              <dd
                className="tabular-nums font-semibold"
                style={{
                  color:
                    pnl > 0
                      ? "var(--yes)"
                      : pnl < 0
                        ? "var(--no)"
                        : "var(--text)",
                }}
              >
                {formatPnL(pnl)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Total Trades</dt>
              <dd className="tabular-nums font-semibold">{tradeCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>
                Markets Created
              </dt>
              <dd className="tabular-nums font-semibold">{marketCount}</dd>
            </div>
            {winRate !== null && (
              <div className="flex justify-between">
                <dt style={{ color: "var(--text-secondary)" }}>Win Rate</dt>
                <dd
                  className="tabular-nums font-semibold"
                  style={{
                    color:
                      winRate >= 50 ? "var(--yes)" : "var(--no)",
                  }}
                >
                  {winRate}% ({wonCount}/{resolvedCount})
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Created Markets */}
        {marketCount > 0 && (
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <h3 className="mb-3 font-semibold">Created Markets</h3>
            <div className="space-y-2 text-sm">
              {(createdMarkets ?? []).map((m) => (
                <Link
                  key={m.id}
                  href={`/markets/${m.id}`}
                  className="block hover:underline"
                  style={{ color: "var(--primary-bright)" }}
                >
                  {m.question}
                  {m.resolved && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor:
                          m.outcome === "YES"
                            ? "rgba(0,166,118,0.15)"
                            : "rgba(229,83,75,0.15)",
                        color:
                          m.outcome === "YES"
                            ? "var(--yes)"
                            : "var(--no)",
                      }}
                    >
                      {m.outcome}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
