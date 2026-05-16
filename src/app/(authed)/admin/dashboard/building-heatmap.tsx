import type { AdminTicket } from "@/lib/admin/types";

const URGENCY_COLORS: Record<string, string> = {
  critical: "#d62828",
  high: "#f77f00",
  medium: "#fcbf49",
  low: "#adb5bd",
};
const URGENCY_LABELS = ["Critical", "High", "Medium", "Low"] as const;
const URGENCY_KEYS = ["critical", "high", "medium", "low"] as const;

interface BuildingRow {
  name: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function BuildingHeatmap({ tickets }: { tickets: AdminTicket[] }) {
  const byBuilding = new Map<string, BuildingRow>();
  for (const t of tickets) {
    const name =
      t.buildingName ?? (t.scope === "society" ? "Society-level" : "Unassigned");
    const row =
      byBuilding.get(name) ??
      { name, total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    row.total++;
    if (t.urgency === "critical") row.critical++;
    else if (t.urgency === "high") row.high++;
    else if (t.urgency === "medium") row.medium++;
    else if (t.urgency === "low") row.low++;
    byBuilding.set(name, row);
  }

  const sorted = Array.from(byBuilding.values()).sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    return (
      <p className="rounded-deh-md border border-dashed border-deh-border px-4 py-8 text-center text-deh-sm text-deh-muted">
        No tickets yet.
      </p>
    );
  }

  const maxTotal = sorted[0].total;

  return (
    <div>
      <div className="mb-3 flex flex-wrap justify-center gap-4">
        {URGENCY_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 text-deh-xs text-deh-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: URGENCY_COLORS[URGENCY_KEYS[i]] }}
            />
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {sorted.map((row) => (
          <div key={row.name} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
            <span className="truncate text-deh-sm text-deh-text" title={row.name}>
              {row.name}
            </span>
            <div className="flex h-5 overflow-hidden rounded-deh-sm bg-deh-gray-200">
              {URGENCY_KEYS.map((key) => {
                const count = row[key];
                if (count === 0) return null;
                const pct = (count / maxTotal) * 100;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-center text-[10px] font-semibold text-white"
                    style={{ width: `${pct}%`, backgroundColor: URGENCY_COLORS[key] }}
                    title={`${count} ${key}`}
                  >
                    {pct > 12 ? count : ""}
                  </div>
                );
              })}
            </div>
            <span className="text-deh-xs font-semibold text-deh-muted">{row.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
