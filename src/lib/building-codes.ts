const DROP_WORDS = new Set(
  [
    "tower",
    "apartment",
    "apartments",
    "building",
    "complex",
    "heights",
    "residency",
    "society",
    "the",
    "and",
    "of",
  ],
);

function tokenize(name: string): string[] {
  return name
    .split(/\s+/)
    .map((t) => t.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);
}

function rawFirstThree(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
}

export function suggestBuildingCodeBase(name: string): string {
  const kept = tokenize(name).filter((t) => !DROP_WORDS.has(t.toLowerCase()));

  let base: string;
  if (kept.length === 1) {
    base = kept[0].slice(0, 3).toUpperCase();
  } else if (kept.length > 1) {
    base = kept.map((t) => t[0]!).join("").toUpperCase();
  } else {
    base = "";
  }

  if (base.length < 2 || base.length > 3) {
    base = rawFirstThree(name);
  }
  return base;
}

export function resolveCollision(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 1;
  while (taken.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export function suggestBuildingCode(name: string, taken: Set<string>): string {
  return resolveCollision(suggestBuildingCodeBase(name), taken);
}
