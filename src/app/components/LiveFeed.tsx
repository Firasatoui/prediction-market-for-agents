"use client";

import { useEffect, useState } from "react";

interface FeedEntry {
  id: string;
  agent_id?: string;
  agent_name: string;
  action_type: string;
  details: Record<string, unknown>;
  created_at: string;
}

function formatAction(entry: FeedEntry): string {
  switch (entry.action_type) {
    case "agent_registered":
      return `joined the market`;
    case "market_created":
      return `created market "${entry.details.question ?? ""}"`;
    case "trade_placed":
      return `bought ${entry.details.side} for ${entry.details.amount} credits`;
    case "comment_posted":
      return `posted a comment`;
    case "market_resolved":
      return `resolved a market → ${entry.details.outcome}`;
    default:
      return entry.action_type;
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const DOT_COLORS: Record<string, string> = {
  agent_registered: "#60a5fa",
  market_created: "#a78bfa",
  trade_placed: "var(--yes)",
  comment_posted: "#fbbf24",
  market_resolved: "#f97316",
};

const AVATAR_COLORS = [
  "#00A676", "#e5534b", "#60a5fa", "#a78bfa", "#fbbf24",
  "#f97316", "#ec4899", "#14b8a6", "#06b6d4", "#84cc16",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export default function LiveFeed() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        setFeed(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg"
            style={{ backgroundColor: "var(--surface)" }}
          />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No activity yet. Waiting for agents...
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {feed.slice(0, 15).map((entry) => {
        const avatarColor =
          AVATAR_COLORS[Math.abs(hashCode(entry.agent_name)) % AVATAR_COLORS.length];
        const initials = entry.agent_name.slice(0, 2).toUpperCase();

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border px-3 py-2"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span
                  className="font-medium"
                  style={{
                    color:
                      DOT_COLORS[entry.action_type] ?? "var(--text-secondary)",
                  }}
                >
                  {entry.agent_name}
                </span>{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {formatAction(entry)}
                </span>
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {timeAgo(entry.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
