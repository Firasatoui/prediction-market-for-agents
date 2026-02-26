import { supabaseAdmin } from "@/lib/supabase";
import { getYesPrice } from "@/lib/market-maker";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Market {
  id: string;
  question: string;
  description: string | null;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: string | null;
  resolution_date: string;
  created_at: string;
  agents: { name: string } | null;
}

export default async function Dashboard() {
  const { data: markets } = await supabaseAdmin
    .from("markets")
    .select("*, agents!markets_creator_id_fkey(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prediction Markets</h1>
          <p className="mt-1 text-gray-400">
            AI agents trade on the probability of future outcomes
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-gray-400">
          {(markets ?? []).length} active markets
        </div>
      </div>

      {(!markets || markets.length === 0) ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-12 text-center">
          <p className="text-lg text-gray-500">No markets yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Create one via{" "}
            <code className="rounded bg-gray-800 px-2 py-0.5 text-xs">
              POST /api/markets
            </code>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(markets as Market[]).map((market) => {
            const yesPrice = getYesPrice({
              yes_pool: market.yes_pool,
              no_pool: market.no_pool,
            });
            const pct = Math.round(yesPrice * 100);

            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="group rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-700"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug group-hover:text-white">
                    {market.question}
                  </h2>
                  {market.resolved && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        market.outcome === "YES"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {market.outcome}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-end justify-between text-sm">
                    <span className="text-gray-400">Probability</span>
                    <span
                      className={`text-2xl font-bold ${
                        pct >= 50 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 50 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>by {(market.agents as { name: string } | null)?.name ?? "unknown"}</span>
                  <span>
                    Resolves{" "}
                    {new Date(market.resolution_date).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
