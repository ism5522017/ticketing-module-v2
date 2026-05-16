/**
 * Port of app/services/triage_service.rb. Same categories, same keyword
 * lists, same escalation rules so V2 triage decisions match the old app
 * byte-for-byte.
 */

export type Urgency = "critical" | "high" | "medium" | "low";

const URGENCY_CATEGORIES: Record<Exclude<Urgency, "low">, string[]> = {
  critical: ["Water leak", "Sewage / flooding", "Fire or safety hazard", "Gas leak"],
  high: ["Electricity problem", "Elevator issue", "Broken door / window", "Pest / insects"],
  medium: ["AC not working", "Plumbing issue", "Broken window / latch"],
};

const URGENCY_RANK: Record<Urgency, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const CRITICAL_KEYWORDS = [
  "flooding", "fire", "smoke", "gas smell", "emergency", "dangerous", "unsafe",
  "collapsed", "electrocution", "sparks", "explosion", "short circuit", "burning",
  "suffocating", "toxic", "unconscious",
];

const HIGH_KEYWORDS = [
  "broken", "not working", "leaking", "sewage smell", "stuck", "trapped", "no water",
  "no electricity", "blackout", "overflowing", "cracked", "shattered", "major", "severe", "urgent",
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getBaseUrgency(type: string): Urgency {
  for (const [level, cats] of Object.entries(URGENCY_CATEGORIES) as [Urgency, string[]][]) {
    if (cats.includes(type)) return level;
  }
  return "low";
}

export interface TriageResult {
  level: Urgency;
  reason: string;
}

export function smartTriage(type: string, description: string | null | undefined): TriageResult {
  let level = getBaseUrgency(type);
  const descLower = (description ?? "").toLowerCase();

  const hitCritical = CRITICAL_KEYWORDS.filter((w) => descLower.includes(w));
  const hitHigh = HIGH_KEYWORDS.filter((w) => descLower.includes(w));

  let reason = `Category: ${type || "Other"} → ${capitalize(level)}`;

  if (hitCritical.length > 0 && URGENCY_RANK[level] < URGENCY_RANK.critical) {
    level = "critical";
    reason += ` | ⚠️ Escalated by keywords: ${hitCritical.join(", ")}`;
  } else if (hitHigh.length > 0 && URGENCY_RANK[level] < URGENCY_RANK.high) {
    level = "high";
    reason += ` | ↑ Boosted by keywords: ${hitHigh.join(", ")}`;
  }

  return { level, reason };
}

export const TICKET_CATEGORIES = [
  "Water leak", "Electricity problem", "AC not working", "Broken door / window",
  "Plumbing issue", "Elevator issue", "Pest / insects", "Sewage / flooding",
  "Fire or safety hazard", "Gas leak", "Broken window / latch",
  "Common area maintenance", "Security / access", "Society query", "Other",
] as const;
