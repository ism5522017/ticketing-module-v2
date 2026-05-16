"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_EXT, ALLOWED_MIME, MAX_FILE_SIZE } from "@/lib/storage/limits";
import { createRequisition } from "../../../../dashboard/actions";

const MAX_INVOICES = 5;
const ACCEPT = ALLOWED_EXT.join(",");

interface FinanceRow {
  description: string;
  amount: string;
}

const EMPTY_ROW: FinanceRow = { description: "", amount: "" };

export function RequisitionForm({ referenceCode }: { referenceCode: string }) {
  const router = useRouter();
  const [surveyed, setSurveyed] = useState(true);
  const [inHouseFix, setInHouseFix] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [rows, setRows] = useState<FinanceRow[]>([{ ...EMPTY_ROW }]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const estCost = useMemo(() => {
    if (inHouseFix) return 0;
    return rows.reduce((sum, r) => {
      const n = parseFloat(r.amount);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [rows, inHouseFix]);

  const costBreakdownStr = useMemo(() => {
    if (inHouseFix) return "";
    return rows
      .filter((r) => r.description.trim() !== "")
      .map((r) => `${r.description.trim()}: ₹${r.amount || "0"}`)
      .join("\n");
  }, [rows, inHouseFix]);

  function updateRow(i: number, patch: Partial<FinanceRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function addFiles(picked: FileList | File[]) {
    const list: File[] = [];
    for (const f of picked) {
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        setError(`Skipped ${f.name}: unsupported type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`Skipped ${f.name}: over 10 MB.`);
        continue;
      }
      list.push(f);
    }
    setFiles((prev) => [...prev, ...list].slice(0, MAX_INVOICES));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!inHouseFix) {
      if (!vendorName.trim()) {
        setError("Vendor name is required.");
        return;
      }
      if (estCost <= 0) {
        setError("Add at least one cost-breakdown line with an amount.");
        return;
      }
    }

    const fd = new FormData();
    fd.append("ticket_id", referenceCode);
    fd.append("surveyed", String(surveyed));
    fd.append("in_house_fix", String(inHouseFix));
    if (!inHouseFix) {
      fd.append("vendor_name", vendorName.trim());
      fd.append("est_cost", String(estCost));
      fd.append("cost_breakdown", costBreakdownStr);
      files.forEach((f) => fd.append("invoices", f));
    } else {
      fd.append("est_cost", "0");
    }

    startTransition(async () => {
      const res = await createRequisition(fd);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.push("/manager/dashboard");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="req-surveyed">Surveyed?</Label>
          <select
            id="req-surveyed"
            value={surveyed ? "true" : "false"}
            onChange={(e) => setSurveyed(e.target.value === "true")}
            disabled={isPending}
            className="mt-1 w-full rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <Label htmlFor="req-in-house">In-house fix?</Label>
          <select
            id="req-in-house"
            value={inHouseFix ? "true" : "false"}
            onChange={(e) => setInHouseFix(e.target.value === "true")}
            disabled={isPending}
            className="mt-1 w-full rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
          >
            <option value="false">No (Vendor)</option>
            <option value="true">Yes (In-house)</option>
          </select>
        </div>
      </div>

      {!inHouseFix ? (
        <>
          <div>
            <Label htmlFor="req-vendor">Vendor name</Label>
            <input
              id="req-vendor"
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              disabled={isPending}
              required
              className="mt-1 w-full rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Cost breakdown</Label>
              <span className="text-deh-xs text-deh-muted">
                Total: <strong className="text-deh-text">₹{estCost.toFixed(2)}</strong>
              </span>
            </div>
            <div className="overflow-hidden rounded-deh-md ring-1 ring-deh-border">
              <table className="w-full text-deh-sm">
                <thead className="bg-deh-gray-bg text-left text-deh-xs uppercase tracking-wide text-deh-muted">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="w-32 px-3 py-2">Amount (₹)</th>
                    <th className="w-12 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deh-border">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={r.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                          disabled={isPending}
                          placeholder={i === 0 ? "Labor / Diagnostic" : "Part details…"}
                          className="w-full rounded-deh-sm border border-transparent bg-transparent px-2 py-1 text-deh-sm outline-none focus:border-deh-blue"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={r.amount}
                          onChange={(e) => updateRow(i, { amount: e.target.value })}
                          disabled={isPending}
                          placeholder="0"
                          className="w-full rounded-deh-sm border border-transparent bg-transparent px-2 py-1 text-right text-deh-sm outline-none focus:border-deh-blue"
                        />
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          disabled={isPending || rows.length === 1}
                          className="text-deh-xs text-deh-red hover:underline disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addRow}
              disabled={isPending}
              className="mt-2 rounded-deh-md border border-deh-border bg-deh-white px-3 py-1.5 text-deh-xs text-deh-text hover:bg-deh-gray-bg"
            >
              + Add row
            </button>
          </div>

          <div>
            <Label>Invoices (optional)</Label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
              disabled={isPending}
            />
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isPending}
                className="rounded-deh-md border border-deh-border bg-deh-white px-3 py-1.5 text-deh-xs text-deh-text hover:bg-deh-gray-bg"
              >
                Choose files
              </button>
              <span className="text-deh-xs text-deh-muted">
                Up to {MAX_INVOICES}, 10 MB each.
              </span>
            </div>
            {files.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between rounded-deh-md bg-deh-gray-bg px-3 py-1.5 text-deh-xs"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={isPending}
                      className="text-deh-red hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}

      {error ? (
        <p className="rounded-deh-md bg-deh-light-orange px-3 py-2 text-deh-sm text-deh-dark-orange">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit requisition"}
        </Button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => router.back()}
          className="text-deh-sm text-deh-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
