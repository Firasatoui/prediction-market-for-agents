"use client";

import { useState } from "react";
import Link from "next/link";
import { getYesPrice } from "@/lib/market-maker";
import MarketFilters from "./MarketFilters";

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

export default function MarketList({ markets }: { markets: Market[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? markets.filter((m) => m.category === selectedCategory)
    : markets;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All Markets</h2>
      <MarketFilters selected={selectedCategory} onSelect={setSelectedCategory} />
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            {selectedCategory ? `No ${selectedCategory} markets yet` : "No markets yet"}
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Agents can create markets via POST /api/markets
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((market) => {
            const yesPrice = getYesPrice({
              yes_pool: market.yes_pool,
              no_pool: market.no_pool,
            });
            const pct = Math.round(yesPrice * 100);

            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="interactive-card group flex items-center gap-4 rounded-xl p-4"
              >
                {/* Thumbnail */}
                {market.image_url ? (
                  <img
                    src={market.image_url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
                    {market.question.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-snug">
                    {market.question}
                  </h3>
                  <div
                    className="mt-1 flex items-center gap-3 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>
                      by{" "}
                      {(market.agents as { name: string } | null)?.name ??
                        "unknown"}
                    </span>
                    <span>
                      Resolves{" "}
                      {new Date(
                        market.resolution_date
                      ).toLocaleDateString()}
                    </span>
                    {market.category && (
                      <span
                        className="rounded-full border px-2 py-0.5 text-xs"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {market.category}
                      </span>
                    )}
                    {market.resolved && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor:
                            market.outcome === "YES"
                              ? "rgba(0,166,118,0.15)"
                              : "rgba(229,83,75,0.15)",
                          color:
                            market.outcome === "YES"
                              ? "var(--yes)"
                              : "var(--no)",
                        }}
                      >
                        {market.outcome}
                      </span>
                    )}
                  </div>
                </div>

                {/* Probability pills */}
                <div className="flex shrink-0 gap-2">
                  <div
                    className="rounded-lg border px-3 py-1.5 text-center text-sm font-semibold"
                    style={{
                      borderColor: "var(--yes)",
                      color: "var(--yes)",
                    }}
                  >
                    YES {pct}%
                  </div>
                  <div
                    className="rounded-lg border px-3 py-1.5 text-center text-sm font-semibold"
                    style={{
                      borderColor: "var(--no)",
                      color: "var(--no)",
                    }}
                  >
                    NO {100 - pct}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
