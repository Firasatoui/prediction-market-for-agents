"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

const TOP_COLORS = ["#00A676", "#60a5fa", "#fbbf24", "#a78bfa", "#14b8a6"];
const BOTTOM_COLORS = ["#e5534b", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4"];

interface AgentPerf {
  agent_id: string;
  agent_name: string;
  current_balance: number;
  data_points: { timestamp: string; balance: number }[];
}

interface MergedPoint {
  date: string;
  timestamp: number;
  [key: string]: string | number;
}

function trimName(name: string): string {
  return name.length > 6 ? name.slice(0, 6) + "\u2026" : name;
}

function buildMergedData(agentSubset: AgentPerf[]): MergedPoint[] {
  const allTimestamps = new Set<number>();
  for (const agent of agentSubset) {
    for (const dp of agent.data_points) {
      allTimestamps.add(new Date(dp.timestamp).getTime());
    }
  }
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  return sortedTimestamps.map((ts) => {
    const point: MergedPoint = {
      date: new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      timestamp: ts,
    };

    for (const agent of agentSubset) {
      let lastBalance = 1000;
      for (const dp of agent.data_points) {
        if (new Date(dp.timestamp).getTime() <= ts) {
          lastBalance = dp.balance;
        } else {
          break;
        }
      }
      // Show P&L relative to starting balance (0 = breakeven)
      point[trimName(agent.agent_name)] = Math.round((lastBalance - 1000) * 100) / 100;
    }

    return point;
  });
}

function formatPnlValue(value: number): string {
  const v = Number(value);
  if (v > 0) return `+${v.toFixed(2)}`;
  return v.toFixed(2);
}

function MiniChart({
  title,
  agents,
  colors,
}: {
  title: string;
  agents: AgentPerf[];
  colors: string[];
}) {
  if (agents.length === 0) return null;
  const merged = buildMergedData(agents);

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={merged}>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            width={60}
            tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 13,
            }}
            formatter={(value) => [formatPnlValue(Number(value)), "P&L"]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          <ReferenceLine
            y={0}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          {agents.map((agent, i) => (
            <Line
              key={agent.agent_id}
              type="monotone"
              dataKey={trimName(agent.agent_name)}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PerformanceComparisonChart() {
  const [agents, setAgents] = useState<AgentPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex h-[340px] items-center justify-center rounded-xl border"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Loading...</span>
          </div>
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div
        className="flex h-[200px] items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>No agent data yet</span>
      </div>
    );
  }

  // Only include agents who actually traded (more than just the initial 1000 data point)
  const active = agents.filter((a) => a.data_points.length > 1);

  if (active.length === 0) {
    return (
      <div
        className="flex h-[200px] items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>No trading activity yet</span>
      </div>
    );
  }

  // Sort by final portfolio value (current_balance includes unrealized)
  const sorted = [...active].sort(
    (a, b) => (b.current_balance ?? 0) - (a.current_balance ?? 0)
  );

  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.length > 5 ? sorted.slice(-5).reverse() : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MiniChart title="Top 5 Performers" agents={top5} colors={TOP_COLORS} />
      <MiniChart title="Bottom 5 Performers" agents={bottom5} colors={BOTTOM_COLORS} />
    </div>
  );
}
