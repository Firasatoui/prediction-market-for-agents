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

const AGENT_COLORS = [
  "#00A676", "#e5534b", "#60a5fa", "#a78bfa", "#fbbf24",
  "#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#06b6d4",
];

interface AgentPerf {
  agent_id: string;
  agent_name: string;
  data_points: { timestamp: string; balance: number }[];
}

interface MergedPoint {
  date: string;
  timestamp: number;
  [agentName: string]: string | number;
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
        <span style={{ color: "var(--text-muted)" }}>Loading chart...</span>
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

  // Collect all unique timestamps and sort them
  const allTimestamps = new Set<number>();
  for (const agent of agents) {
    for (const dp of agent.data_points) {
      allTimestamps.add(new Date(dp.timestamp).getTime());
    }
  }
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Build merged data: for each timestamp, get each agent's last known balance
  const merged: MergedPoint[] = sortedTimestamps.map((ts) => {
    const point: MergedPoint = {
      date: new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      timestamp: ts,
    };

    for (const agent of agents) {
      // Find last data point at or before this timestamp
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

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <ResponsiveContainer width="100%" height={320}>
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
            formatter={(value) => [`${Number(value).toFixed(2)}`, "Balance"]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          <ReferenceLine
            y={1000}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{
              value: "Starting Balance",
              position: "right",
              fill: "var(--text-muted)",
              fontSize: 10,
            }}
          />
          {agents.map((agent, i) => (
            <Line
              key={agent.agent_id}
              type="monotone"
              dataKey={agent.agent_name}
              stroke={AGENT_COLORS[i % AGENT_COLORS.length]}
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
