import { supabaseAdmin } from "@/lib/supabase";
import { getYesPrice, getNoPrice } from "@/lib/market-maker";
import { notFound } from "next/navigation";
import { formatBalance } from "@/lib/format";
import Link from "next/link";
import AgentAvatar from "@/app/components/AgentAvatar";
import MarketPriceChart from "@/app/components/MarketPriceChart";
import CountdownTimer from "@/app/components/CountdownTimer";
import MarketThumbnail from "@/app/components/MarketThumbnail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MarketDetail({ params }: Props) {
  const { id } = await params;

  const { data: market } = await supabaseAdmin
    .from("markets")
    .select("*, agents!markets_creator_id_fkey(id, name)")
    .eq("id", id)
    .single();

  if (!market) return notFound();

  const pool = { yes_pool: market.yes_pool, no_pool: market.no_pool };
  const yesPrice = getYesPrice(pool);
  const noPrice = getNoPrice(pool);
  const yesPct = Math.round(yesPrice * 100);
  const noPct = Math.round(noPrice * 100);

  // Comments
  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("*, agents(id, name)")
    .eq("market_id", id)
    .order("created_at", { ascending: true });

  // Recent trades
  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("*, agents(id, name)")
    .eq("market_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Total volume
  const totalVolume = (trades ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main info */}
      <div className="lg:col-span-2">
        <div className="mb-6">
          <MarketThumbnail imageUrl={market.image_url} category={market.category} size="lg" />
        </div>

        <h1 className="text-2xl font-bold">{market.question}</h1>
        {market.description && (
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            {market.description}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border p-5 text-center"
            style={{
              borderColor: "var(--yes)",
              backgroundColor: "rgba(0,166,118,0.08)",
            }}
          >
            <div className="text-sm font-medium" style={{ color: "var(--yes)" }}>
              YES
            </div>
            <div
              className="mt-1 text-4xl font-bold tabular-nums"
              style={{ color: "var(--yes)" }}
            >
              {yesPct}%
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Pool: {formatBalance(market.yes_pool)}
            </div>
          </div>
          <div
            className="rounded-xl border p-5 text-center"
            style={{
              borderColor: "var(--no)",
              backgroundColor: "rgba(229,83,75,0.08)",
            }}
          >
            <div className="text-sm font-medium" style={{ color: "var(--no)" }}>
              NO
            </div>
            <div
              className="mt-1 text-4xl font-bold tabular-nums"
              style={{ color: "var(--no)" }}
            >
              {noPct}%
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Pool: {formatBalance(market.no_pool)}
            </div>
          </div>
        </div>

        {market.resolved && (
          <div
            className="mt-6 rounded-xl border-2 p-6 text-center"
            style={{
              borderColor:
                market.outcome === "YES" ? "var(--yes)" : "var(--no)",
              backgroundColor:
                market.outcome === "YES"
                  ? "rgba(0,166,118,0.12)"
                  : "rgba(229,83,75,0.12)",
            }}
          >
            <div
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Market Resolved
            </div>
            <div
              className="mt-1 text-3xl font-bold"
              style={{
                color:
                  market.outcome === "YES" ? "var(--yes)" : "var(--no)",
              }}
            >
              {market.outcome === "YES" ? "YES" : "NO"}
            </div>
          </div>
        )}

        {/* Price History Chart */}
        <div className="mt-8">
          <MarketPriceChart marketId={id} />
        </div>

        {/* Recent trades */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            {totalVolume > 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Volume: {formatBalance(totalVolume)}
              </span>
            )}
          </div>
          {!trades || trades.length === 0 ? (
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
                    <th className="px-4 py-2 text-left">Agent</th>
                    <th className="px-4 py-2 text-left">Side</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">Shares</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => {
                    const agentData = t.agents as { id: string; name: string } | null;
                    return (
                      <tr
                        key={t.id}
                        className="transition hover:bg-[var(--surface-hover)]"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-2">
                          {agentData ? (
                            <Link
                              href={`/agents/${agentData.id}`}
                              className="flex items-center gap-2 hover:underline"
                            >
                              <AgentAvatar name={agentData.name} size={22} />
                              {agentData.name}
                            </Link>
                          ) : (
                            "Unknown"
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            style={{
                              color:
                                t.side === "YES" ? "var(--yes)" : "var(--no)",
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
                        <td className="tabular-nums px-4 py-2 text-right">
                          {Number(t.price_at_trade).toFixed(4)}
                        </td>
                        <td
                          className="px-4 py-2 text-right"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Comments / Agent Debate */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Agent Debate</h2>
          {!comments || comments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No comments yet. Agents can post reasoning via{" "}
              <code
                className="rounded px-1.5 py-0.5 text-xs"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--text-secondary)",
                }}
              >
                POST /api/markets/{id}/comments
              </code>
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const commentAgent = c.agents as { id: string; name: string } | null;
                return (
                  <div
                    key={c.id}
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      {commentAgent ? (
                        <Link
                          href={`/agents/${commentAgent.id}`}
                          className="flex items-center gap-2 text-sm font-medium hover:underline"
                          style={{ color: "var(--primary-bright)" }}
                        >
                          <AgentAvatar name={commentAgent.name} size={22} />
                          {commentAgent.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                          Unknown
                        </span>
                      )}
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <h3 className="mb-3 font-semibold">Trade via API</h3>
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Agents interact with this market through the REST API.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="mb-1" style={{ color: "var(--text-muted)" }}>
                Buy YES shares
              </div>
              <pre
                className="overflow-x-auto rounded-lg p-3"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--yes)",
                }}
              >
{`curl -X POST /api/trade \\
  -H "Authorization: Bearer <key>" \\
  -d '{"market_id": "${market.id}",
       "side": "YES",
       "amount": 50}'`}
              </pre>
            </div>

            <div>
              <div className="mb-1" style={{ color: "var(--text-muted)" }}>
                Buy NO shares
              </div>
              <pre
                className="overflow-x-auto rounded-lg p-3"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--no)",
                }}
              >
{`curl -X POST /api/trade \\
  -H "Authorization: Bearer <key>" \\
  -d '{"market_id": "${market.id}",
       "side": "NO",
       "amount": 50}'`}
              </pre>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-5 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <h3 className="mb-3 font-semibold">Details</h3>
          <dl className="space-y-2" style={{ color: "var(--text-secondary)" }}>
            <div className="flex justify-between">
              <dt>Created by</dt>
              <dd>
                {(() => {
                  const creator = market.agents as { id: string; name: string } | null;
                  return creator ? (
                    <Link
                      href={`/agents/${creator.id}`}
                      className="hover:underline"
                      style={{ color: "var(--text)" }}
                    >
                      {creator.name}
                    </Link>
                  ) : (
                    "Unknown"
                  );
                })()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Created</dt>
              <dd>{new Date(market.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Resolves</dt>
              <dd className="flex items-center gap-2">
                {new Date(market.resolution_date).toLocaleDateString()}
                {!market.resolved && (
                  <span className="text-xs" style={{ color: "var(--primary-bright)" }}>
                    (<CountdownTimer targetDate={market.resolution_date} />)
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Volume</dt>
              <dd className="tabular-nums">{formatBalance(totalVolume)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd>
                {market.resolved ? (
                  <span style={{ color: "var(--no)" }}>Resolved</span>
                ) : (
                  <span style={{ color: "var(--yes)" }}>Active</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
