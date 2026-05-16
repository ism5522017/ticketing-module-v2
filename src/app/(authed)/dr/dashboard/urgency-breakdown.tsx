import { cn } from "@/lib/utils";
import { urgencyMeta } from "@/lib/tickets";
import type { DrStats } from "@/lib/dr/building-stats";

const ORDER: Array<keyof DrStats["by_urgency"]> = ["critical", "high", "medium", "low"];

export function UrgencyBreakdown({ byUrgency }: { byUrgency: DrStats["by_urgency"] }) {
  const visible = ORDER.filter((k) => byUrgency[k] > 0);

  if (visible.length === 0) {
    return (
      <p className="text-deh-sm text-deh-muted">No active urgency data.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((k) => {
        const meta = urgencyMeta(k);
        return (
          <span
            key={k}
            className={cn(
              "inline-flex items-center gap-2 rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
              meta.pillClass,
            )}
          >
            <span>{meta.label}</span>
            <span className="rounded-deh-pill bg-black/15 px-1.5 text-deh-xs">
              {byUrgency[k]}
            </span>
          </span>
        );
      })}
    </div>
  );
}
