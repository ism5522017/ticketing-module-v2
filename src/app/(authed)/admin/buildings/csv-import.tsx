"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importBuildingsCsvAction, type CsvImportResult } from "./actions";

const SAMPLE_CSV = `name,locality,city,state,address,category
Husami Manzil,Bohri Mohalla,Mumbai,Maharashtra,"Near Old Post Office",Residential
Saifee Apts,,Mumbai,,,Residential`;

export function CsvImport() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; data: CsvImportResult }
    | { kind: "err"; text: string }
    | null
  >(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const res = await importBuildingsCsvAction(text);
      if (res.ok) {
        setResult({ kind: "ok", data: res.data! });
        setText("");
      } else {
        setResult({ kind: "err", text: res.error });
      }
    });
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Bulk import (CSV)
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-deh-md border border-deh-border bg-deh-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-deh-text">Bulk import properties</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setText("");
            setResult(null);
          }}
        >
          Close
        </Button>
      </div>
      <p className="mb-3 text-deh-xs text-deh-muted">
        Header row must include <code className="font-mono">name</code>.
        Optional columns: <code className="font-mono">locality</code>,{" "}
        <code className="font-mono">city</code>,{" "}
        <code className="font-mono">state</code>,{" "}
        <code className="font-mono">address</code>,{" "}
        <code className="font-mono">category</code>. Duplicates (same name)
        are skipped.
      </p>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label htmlFor="csv-file">Upload CSV file</Label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={isPending}
            className="mt-1 block w-full text-deh-sm"
          />
        </div>
        <div>
          <Label htmlFor="csv-text">…or paste CSV here</Label>
          <textarea
            id="csv-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending}
            rows={6}
            placeholder={SAMPLE_CSV}
            className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 font-mono text-deh-xs"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={submit} disabled={isPending || text.trim().length === 0}>
          {isPending ? "Importing…" : "Import"}
        </Button>
      </div>
      {result ? (
        result.kind === "ok" ? (
          <div className="mt-3 rounded-deh-md bg-status-resolved/10 px-3 py-2 text-deh-sm">
            <p className="font-semibold text-status-resolved">
              Imported {result.data.inserted}{" "}
              {result.data.inserted === 1 ? "property" : "properties"}.
            </p>
            {result.data.skipped.length > 0 ? (
              <details className="mt-1 text-deh-xs text-deh-muted">
                <summary className="cursor-pointer">
                  Skipped {result.data.skipped.length}{" "}
                  {result.data.skipped.length === 1 ? "row" : "rows"}
                </summary>
                <ul className="mt-1 list-disc pl-5">
                  {result.data.skipped.map((s) => (
                    <li key={s.line}>Line {s.line}: {s.reason}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-deh-sm text-deh-red">{result.text}</p>
        )
      ) : null}
    </div>
  );
}
