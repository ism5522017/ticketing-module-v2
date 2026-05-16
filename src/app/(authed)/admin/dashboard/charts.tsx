"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminTicket } from "@/lib/admin/types";

const URGENCY_COLORS = {
  Critical: "#d62828",
  High: "#f77f00",
  Medium: "#fcbf49",
  Low: "#adb5bd",
} as const;

const STATUS_COLORS = {
  Open: "#fcbf49",
  "In Progress": "#f77f00",
  Resolved: "#003049",
} as const;

const ISSUE_PALETTE = [
  "#003049",
  "#d62828",
  "#f77f00",
  "#fcbf49",
  "#577590",
  "#43aa8b",
  "#f94144",
  "#f3722c",
  "#90be6d",
  "#4d908e",
  "#277da1",
  "#f9844a",
];

function dayLabel(iso: string): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function dayKey(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function UrgencyChart({ tickets }: { tickets: AdminTicket[] }) {
  const data = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of tickets) {
      if (t.status === "resolved") continue;
      if (t.urgency in counts) counts[t.urgency as keyof typeof counts]++;
    }
    return [
      { name: "Critical", value: counts.critical, color: URGENCY_COLORS.Critical },
      { name: "High", value: counts.high, color: URGENCY_COLORS.High },
      { name: "Medium", value: counts.medium, color: URGENCY_COLORS.Medium },
      { name: "Low", value: counts.low, color: URGENCY_COLORS.Low },
    ];
  }, [tickets]);

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => {
              const num = typeof v === "number" ? v : Number(v ?? 0);
              return [`${num} (${total ? ((num / total) * 100).toFixed(1) : 0}%)`, name];
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ tickets }: { tickets: AdminTicket[] }) {
  const data = useMemo(() => {
    const byDay = new Map<
      string,
      { key: string; label: string; Open: number; "In Progress": number; Resolved: number }
    >();
    for (const t of tickets) {
      const k = dayKey(t.submittedAt);
      if (!k) continue;
      const row =
        byDay.get(k) ??
        { key: k, label: dayLabel(t.submittedAt), Open: 0, "In Progress": 0, Resolved: 0 };
      if (t.status === "open") row.Open++;
      else if (t.status === "progress") row["In Progress"]++;
      else if (t.status === "resolved") row.Resolved++;
      byDay.set(k, row);
    }
    return Array.from(byDay.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [tickets]);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="Open"
            stroke={STATUS_COLORS.Open}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="In Progress"
            stroke={STATUS_COLORS["In Progress"]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Resolved"
            stroke={STATUS_COLORS.Resolved}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IssueTypeChart({ tickets }: { tickets: AdminTicket[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tickets) {
      if (t.status === "resolved") continue;
      counts.set(t.type, (counts.get(t.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  return (
    <div style={{ height: Math.max(240, data.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="type"
            tick={{ fontSize: 11 }}
            width={150}
          />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={ISSUE_PALETTE[i % ISSUE_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResolvedChart({ tickets }: { tickets: AdminTicket[] }) {
  const data = useMemo(() => {
    const byDay = new Map<string, { key: string; label: string; count: number }>();
    for (const t of tickets) {
      if (t.status !== "resolved") continue;
      const k = dayKey(t.resolvedAt ?? t.submittedAt);
      if (!k) continue;
      const row =
        byDay.get(k) ?? { key: k, label: dayLabel(t.resolvedAt ?? t.submittedAt), count: 0 };
      row.count++;
      byDay.set(k, row);
    }
    const sorted = Array.from(byDay.values()).sort((a, b) => a.key.localeCompare(b.key));
    let cum = 0;
    return sorted.map((r) => {
      cum += r.count;
      return { label: r.label, cumulative: cum };
    });
  }, [tickets]);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => {
              const num = typeof v === "number" ? v : Number(v ?? 0);
              return [`${num} total resolved`, "Resolved"];
            }}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#003049"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
