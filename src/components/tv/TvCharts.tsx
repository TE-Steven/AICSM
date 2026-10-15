"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const AXIS_TICK = { fill: "#64748b", fontSize: 14 };

function shorten(name: string, max = 7): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

/** 各構面完成度：已完成項目數 vs 未完成項目數（分組長條圖）。 */
export function CategoryBarChart({
  data,
}: {
  data: { name: string; doneCount: number; totalCount: number }[];
}) {
  const rows = data.map((d) => ({
    name: shorten(d.name),
    已完成: d.doneCount,
    未完成: d.totalCount - d.doneCount,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 16, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} interval={0} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <Bar dataKey="已完成" fill="#0ea5e9" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="已完成" position="top" style={{ fill: "#334155", fontSize: 14, fontWeight: 600 }} />
        </Bar>
        <Bar dataKey="未完成" fill="#f59e0b" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="未完成" position="top" style={{ fill: "#334155", fontSize: 14, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 健康度趨勢：歷次評比分數折線圖，80 分虛線為「健康」門檻。 */
export function ScoreTrendChart({ data }: { data: { label: string; score: number | null }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 18, right: 24, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0ea5e9"
          strokeWidth={3}
          dot={{ r: 4, fill: "#0ea5e9", stroke: "#ffffff", strokeWidth: 2 }}
          isAnimationActive={false}
          connectNulls
        >
          <LabelList
            dataKey="score"
            position="top"
            formatter={(v: unknown) => (typeof v === "number" ? `${Math.round(v)}%` : "")}
            style={{ fill: "#334155", fontSize: 14, fontWeight: 600 }}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
