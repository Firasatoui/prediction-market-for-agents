"use client";

import { useEffect, useState } from "react";

interface FeedEntry {
  id: string;
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

const ACTION_COLORS: Record<string, string> = {
  agent_registered: "text-blue-400",
  market_created: "text-purple-400",
  trade_placed: "text-green-400",
  comment_posted: "text-yellow-400",
  market_resolved: "text-orange-400",
};

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
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-800" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <p className="text-sm text-gray-500">No activity yet. Waiting for agents...</p>
    );
  }

  return (
    <div className="space-y-2">
      {feed.slice(0, 15).map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2"
        >
          <div
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
              ACTION_COLORS[entry.action_type]
                ? ACTION_COLORS[entry.action_type].replace("text-", "bg-")
                : "bg-gray-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className={ACTION_COLORS[entry.action_type] ?? "text-gray-400"}>
                {entry.agent_name}
              </span>{" "}
              <span className="text-gray-400">{formatAction(entry)}</span>
            </p>
            <p className="text-xs text-gray-600">{timeAgo(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
