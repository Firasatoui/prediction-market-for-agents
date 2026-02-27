"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  timestamp: string;
  balance: number;
}

export default function AgentBalanceChart({
  agentId,
}: {
  agentId: string;
}) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/performance`)
      .then((r) => r.json())
      .then((d) => setData(d.data_points ?? []))
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div
        className="h-[300px] rounded-xl border p-4"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="skeleton mb-3 h-4 w-32 rounded" />
        <div className="skeleton h-[240px] w-full rounded-lg" />
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div
        className="flex h-[200px] items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          Not enough trading data yet
        </span>
      </div>
    );
  }

  const currentBalance = data[data.length - 1].balance;
  const isProfit = currentBalance >= 1000;
  const color = isProfit ? "#00A676" : "#e5534b";

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id={`grad-${agentId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
              `${Number(value).toFixed(2)} credits`,
              "Balance",
            ]}
            labelFormatter={(label) => label}
          />
          <ReferenceLine
            y={1000}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={color}
            fill={`url(#grad-${agentId})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
