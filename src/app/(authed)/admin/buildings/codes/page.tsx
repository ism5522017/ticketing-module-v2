import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";
import { suggestBuildingCode } from "@/lib/building-codes";
import { CodeEditorRow } from "./code-editor";

export const dynamic = "force-dynamic";

export default async function BuildingCodesPage() {
  const rows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      locality: buildings.locality,
      city: buildings.city,
      code: buildings.code,
    })
    .from(buildings)
    .orderBy(asc(buildings.name));

  const taken = new Set<string>(
    rows.filter((b) => b.code).map((b) => b.code!.toUpperCase()),
  );

  const withSuggestions = rows.map((b) => {
    const suggested = b.code ?? suggestBuildingCode(b.name, taken);
    if (!b.code) taken.add(suggested);
    return { ...b, suggested };
  });

  const missing = withSuggestions.filter((b) => !b.code).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Building codes</h1>
        <p className="text-deh-sm text-deh-muted">
          Codes power tenant login (typed as <span className="font-mono">BUILDING-FLAT</span>).
          Review the auto-suggestions, edit any you want to change, and save each
          row. Once every building has a confirmed code, run a final
          <span className="font-mono"> ALTER TABLE buildings ALTER COLUMN code SET NOT NULL</span> via
          the Supabase SQL Editor.
        </p>
        <p className="text-deh-sm text-deh-muted mt-2">
          {missing === 0
            ? `All ${rows.length} buildings have a saved code.`
            : `${missing} of ${rows.length} buildings are still unsaved.`}
        </p>
      </header>

      <table className="w-full border-collapse text-deh-base">
        <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
          <tr className="border-b border-deh-border">
            <th className="px-3 py-2 text-left font-semibold">Building</th>
            <th className="px-3 py-2 text-left font-semibold">Locality</th>
            <th className="px-3 py-2 text-left font-semibold">City</th>
            <th className="px-3 py-2 text-left font-semibold">Suggested</th>
            <th className="px-3 py-2 text-left font-semibold">Confirmed</th>
          </tr>
        </thead>
        <tbody>
          {withSuggestions.map((b) => (
            <tr key={b.id} className="border-b border-deh-border">
              <td className="px-3 py-3 font-medium text-deh-text">{b.name}</td>
              <td className="px-3 py-3 text-deh-muted">{b.locality ?? "—"}</td>
              <td className="px-3 py-3 text-deh-muted">{b.city ?? "—"}</td>
              <td className="px-3 py-3 font-mono text-deh-blue">{b.suggested}</td>
              <td className="px-3 py-3">
                <CodeEditorRow
                  id={b.id}
                  initialCode={b.code}
                  suggested={b.suggested}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
