"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBuildingCode } from "./actions";

export function CodeEditorRow({
  id,
  initialCode,
  suggested,
}: {
  id: string;
  initialCode: string | null;
  suggested: string;
}) {
  const [value, setValue] = useState(initialCode ?? suggested);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialCode);

  const dirty = value.trim().toUpperCase() !== (saved ?? "").toUpperCase();

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateBuildingCode(id, value);
      if (res.ok) {
        setSaved(res.code);
        setValue(res.code);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        className="w-24 font-mono uppercase"
        maxLength={4}
        disabled={isPending}
      />
      <Button
        type="button"
        onClick={onSave}
        disabled={isPending || !dirty}
        size="sm"
      >
        {isPending ? "Saving…" : saved && !dirty ? "Saved" : "Save"}
      </Button>
      {error ? <span className="text-deh-xs text-deh-red">{error}</span> : null}
    </div>
  );
}
