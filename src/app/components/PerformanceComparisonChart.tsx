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
  [agentName: string]: string | number;
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
      point[agent.agent_name] = lastBalance;
    }

    return point;
  });
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 13,
            }}
            formatter={(value) => [
              `${Number(value).toFixed(2)}`,
              "Portfolio",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          <ReferenceLine
            y={1000}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          {agents.map((agent, i) => (
            <Line
              key={agent.agent_id}
              type="monotone"
              dataKey={agent.agent_name}
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
      <div
        className="flex h-[350px] items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>Loading charts...</span>
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

  // Sort by final balance (current_balance includes unrealized value)
  const sorted = [...agents].sort(
    (a, b) => (b.current_balance ?? 0) - (a.current_balance ?? 0)
  );

  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse(); // worst first

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MiniChart title="Top 5 Performers" agents={top5} colors={TOP_COLORS} />
      <MiniChart
        title="Bottom 5 Performers"
        agents={bottom5}
        colors={BOTTOM_COLORS}
      />
    </div>
  );
}
