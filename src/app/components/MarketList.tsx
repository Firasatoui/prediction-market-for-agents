"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getYesPrice } from "@/lib/market-maker";
import MarketFilters from "./MarketFilters";
import MarketThumbnail from "./MarketThumbnail";

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

type SortOption = "newest" | "closing" | "active";

function timeRemaining(dateStr: string, resolved: boolean): string {
  if (resolved) return "Closed";
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return "Closing soon";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days < 7) return `Closes in ${days}d`;
  if (days < 30) return `Closes in ${Math.floor(days / 7)}w`;
  return `Closes in ${Math.floor(days / 30)}mo`;
}

export default function MarketList({
  markets,
  tradeCounts = {},
}: {
  markets: Market[];
  tradeCounts?: Record<string, number>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const result = useMemo(() => {
    let list = markets;

    // Category filter
    if (selectedCategory) {
      list = list.filter((m) => m.category === selectedCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.question.toLowerCase().includes(q));
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "closing") {
        // Unresolved first, then by resolution_date ascending
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
      }
      if (sortBy === "active") {
        return (tradeCounts[b.id] ?? 0) - (tradeCounts[a.id] ?? 0);
      }
      // newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [markets, selectedCategory, search, sortBy, tradeCounts]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All Markets</h2>

      {/* Search + Sort row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--primary-bright)]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="shrink-0 rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
          }}
        >
          <option value="newest">Newest</option>
          <option value="closing">Closing Soon</option>
          <option value="active">Most Active</option>
        </select>
      </div>

      <MarketFilters selected={selectedCategory} onSelect={setSelectedCategory} />

      {result.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-6 text-center sm:p-12"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            {search ? "No markets match your search" : selectedCategory ? `No ${selectedCategory} markets yet` : "No markets yet"}
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {search ? "Try a different keyword" : "Agents can create markets via POST /api/markets"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.map((market) => {
            const yesPrice = getYesPrice({
              yes_pool: market.yes_pool,
              no_pool: market.no_pool,
            });
            const pct = Math.round(yesPrice * 100);
            const trades = tradeCounts[market.id] ?? 0;
            const timeLeft = timeRemaining(market.resolution_date, market.resolved);

            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="interactive-card group flex items-start gap-3 rounded-xl p-4 sm:items-center sm:gap-4"
              >
                {/* Thumbnail — hidden on mobile */}
                <div className="hidden sm:block">
                  <MarketThumbnail imageUrl={market.image_url} category={market.category} size="sm" />
                </div>

                {/* Info + pills */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-snug sm:text-base" title={market.question}>
                    {market.question}
                  </h3>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:gap-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>
                      by{" "}
                      {(market.agents as { name: string } | null)?.name ??
                        "unknown"}
                    </span>
                    <span>{timeLeft}</span>
                    {trades > 0 && <span>{trades} trade{trades !== 1 ? "s" : ""}</span>}
                    {market.category && (
                      <span
                        className="hidden rounded-full border px-2 py-0.5 text-xs sm:inline"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {market.category}
                      </span>
                    )}
                    {market.resolved && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor:
                            market.outcome === "YES"
                              ? "rgba(0,166,118,0.2)"
                              : "rgba(229,83,75,0.2)",
                          color:
                            market.outcome === "YES"
                              ? "var(--yes)"
                              : "var(--no)",
                        }}
                      >
                        Resolved: {market.outcome}
                      </span>
                    )}
                  </div>

                  {/* Probability pills — inline on mobile */}
                  <div className="mt-2 flex gap-2 sm:hidden">
                    <div
                      className="rounded-md border px-2.5 py-1 text-center text-xs font-semibold"
                      style={{
                        borderColor: "var(--yes)",
                        color: "var(--yes)",
                      }}
                    >
                      YES {pct}%
                    </div>
                    <div
                      className="rounded-md border px-2.5 py-1 text-center text-xs font-semibold"
                      style={{
                        borderColor: "var(--no)",
                        color: "var(--no)",
                      }}
                    >
                      NO {100 - pct}%
                    </div>
                  </div>
                </div>

                {/* Probability pills — desktop only */}
                <div className="hidden shrink-0 gap-2 sm:flex">
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
