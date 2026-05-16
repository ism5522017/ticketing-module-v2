/**
 * Personal viewing report: buildings + codes + units + tenants.
 *
 *   npm run dump-directory          # writes building-directory.md in the repo root
 *
 * Read-only — no writes to the DB.
 */

import { writeFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tenants, units } from "@/db/schema";

interface UnitWithTenants {
  unitId: string;
  wing: string | null;
  flat: string | null;
  floor: string | null;
  unitType: string | null;
  residentName: string | null;
  tenants: { name: string; email: string; phone: string | null; active: boolean }[];
}

interface BuildingBlock {
  id: string;
  name: string;
  code: string | null;
  locality: string | null;
  city: string | null;
  units: UnitWithTenants[];
}

async function load(): Promise<BuildingBlock[]> {
  const buildingRows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      code: buildings.code,
      locality: buildings.locality,
      city: buildings.city,
    })
    .from(buildings)
    .orderBy(asc(buildings.name));

  const result: BuildingBlock[] = [];

  for (const b of buildingRows) {
    const unitRows = await db
      .select({
        id: units.id,
        wing: units.wing,
        flat: units.flat,
        floor: units.floor,
        unitType: units.unitType,
        residentName: units.residentName,
      })
      .from(units)
      .where(eq(units.buildingId, b.id))
      .orderBy(asc(units.wing), asc(units.flat));

    const unitBlocks: UnitWithTenants[] = [];
    for (const u of unitRows) {
      const tenantRows = await db
        .select({
          name: tenants.name,
          email: tenants.email,
          phone: tenants.phone,
          active: tenants.active,
        })
        .from(tenants)
        .where(eq(tenants.unitId, u.id))
        .orderBy(asc(tenants.name));
      unitBlocks.push({
        unitId: u.id,
        wing: u.wing,
        flat: u.flat,
        floor: u.floor,
        unitType: u.unitType,
        residentName: u.residentName,
        tenants: tenantRows,
      });
    }

    result.push({
      id: b.id,
      name: b.name,
      code: b.code,
      locality: b.locality,
      city: b.city,
      units: unitBlocks,
    });
  }

  return result;
}

function flatLabel(u: UnitWithTenants): string {
  const wing = u.wing ? `${u.wing}-` : "";
  const flat = u.flat ?? "?";
  return `${wing}${flat}`;
}

function render(buildings: BuildingBlock[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 10);
  lines.push(`# DEH Building Directory`);
  lines.push("");
  lines.push(`_Generated ${now}._`);
  lines.push("");

  // Top summary.
  const totalUnits = buildings.reduce((sum, b) => sum + b.units.length, 0);
  const totalTenants = buildings.reduce(
    (sum, b) => sum + b.units.reduce((s, u) => s + u.tenants.length, 0),
    0,
  );
  lines.push(`**${buildings.length}** buildings · **${totalUnits}** units · **${totalTenants}** tenants on file.`);
  lines.push("");

  // Building index.
  lines.push(`## Buildings & codes`);
  lines.push("");
  lines.push(`| Code | Building | Locality | City | Units |`);
  lines.push(`|---|---|---|---|---|`);
  for (const b of buildings) {
    lines.push(
      `| \`${b.code ?? "—"}\` | ${b.name} | ${b.locality ?? "—"} | ${b.city ?? "—"} | ${b.units.length} |`,
    );
  }
  lines.push("");

  // Per-building detail.
  for (const b of buildings) {
    lines.push(`---`);
    lines.push("");
    const codeLabel = b.code ? `\`${b.code}\`` : "_(no code)_";
    lines.push(`## ${codeLabel} ${b.name}`);
    if (b.locality || b.city) {
      lines.push(`_${[b.locality, b.city].filter(Boolean).join(", ")}_`);
    }
    lines.push("");

    if (b.units.length === 0) {
      lines.push(`_No units recorded._`);
      lines.push("");
      continue;
    }

    lines.push(`| Wing/Flat | Floor | Type | Tenant(s) | Email | Phone |`);
    lines.push(`|---|---|---|---|---|---|`);
    for (const u of b.units) {
      if (u.tenants.length === 0) {
        lines.push(
          `| **${flatLabel(u)}** | ${u.floor ?? "—"} | ${u.unitType ?? "—"} | ${
            u.residentName ?? "_(vacant)_"
          } | — | — |`,
        );
      } else {
        for (let i = 0; i < u.tenants.length; i++) {
          const t = u.tenants[i]!;
          const flag = t.active ? "" : " _(inactive)_";
          const cell = i === 0 ? `**${flatLabel(u)}**` : `↳`;
          const floor = i === 0 ? u.floor ?? "—" : "";
          const type = i === 0 ? u.unitType ?? "—" : "";
          lines.push(
            `| ${cell} | ${floor} | ${type} | ${t.name}${flag} | ${t.email} | ${t.phone ?? "—"} |`,
          );
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  console.log("Loading buildings + units + tenants…");
  const data = await load();
  const md = render(data);
  const outPath = "building-directory.md";
  writeFileSync(outPath, md, "utf8");
  console.log(`Wrote ${outPath} — ${data.length} buildings`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
