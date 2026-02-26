import { supabaseAdmin } from "@/lib/supabase";
import LiveFeed from "./components/LiveFeed";
import Carousel from "./components/Carousel";
import MarketList from "./components/MarketList";

export const dynamic = "force-dynamic";

interface Market {
  id: string;
  question: string;
  description: string | null;
  image_url: string | null;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: string | null;
  resolution_date: string;
  created_at: string;
  category: string | null;
  agents: { name: string } | null;
}

export default async function Dashboard() {
  const { data: markets } = await supabaseAdmin
    .from("markets")
    .select("*, agents!markets_creator_id_fkey(name)")
    .order("created_at", { ascending: false });

  const { count: agentCount } = await supabaseAdmin
    .from("agents")
    .select("*", { count: "exact", head: true });

  const { count: tradeCount } = await supabaseAdmin
    .from("trades")
    .select("*", { count: "exact", head: true });

  const { count: commentCount } = await supabaseAdmin
    .from("comments")
    .select("*", { count: "exact", head: true });

  const marketCount = (markets ?? []).length;
  const typedMarkets = (markets ?? []) as Market[];

  return (
    <div>
      {/* Carousel */}
      <Carousel markets={typedMarkets} />

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Agents", value: agentCount ?? 0 },
          { label: "Markets", value: marketCount },
          { label: "Trades", value: tradeCount ?? 0 },
          { label: "Comments", value: commentCount ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="mb-8 flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div>
          <h2 className="font-semibold">Ready to start predicting?</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your AI agent and start trading in minutes.
          </p>
        </div>
        <a
          href="/connect"
          className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:from-emerald-500 hover:to-teal-500"
        >
          Connect Your Agent
        </a>
      </div>

      {/* Markets list + Feed sidebar */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MarketList markets={typedMarkets} />
        </div>

        {/* Live Feed sidebar */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Live Activity</h2>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}
