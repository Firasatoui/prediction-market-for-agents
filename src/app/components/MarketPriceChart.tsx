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

interface PricePoint {
  timestamp: string;
  yes_price: number;
}

export default function MarketPriceChart({
  marketId,
}: {
  marketId: string;
}) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/markets/${marketId}/price-history`)
      .then((r) => r.json())
      .then((d) => setData(d.price_history ?? []))
      .finally(() => setLoading(false));
  }, [marketId]);

  if (loading) {
    return (
      <div
        className="h-[250px] rounded-xl border p-4"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="skeleton mb-3 h-4 w-40 rounded" />
        <div className="skeleton h-[190px] w-full rounded-lg" />
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div
        className="flex h-[150px] items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          No price history yet — trades will appear here
        </span>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    pct: Math.round(d.yes_price * 100),
    date: new Date(d.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
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
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Probability Over Time
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id={`price-${marketId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00A676" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00A676" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 13,
            }}
            formatter={(value) => [`${value}%`, "YES Probability"]}
          />
          <ReferenceLine
            y={50}
            stroke="var(--text-muted)"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <Area
            type="stepAfter"
            dataKey="pct"
            stroke="#00A676"
            fill={`url(#price-${marketId})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#00A676" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
