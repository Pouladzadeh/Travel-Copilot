"use client";

import { useState } from "react";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";

/** "Edit a requirement" (Figma moment 120:718): nothing changes until Update results. */
export function BudgetEditor({
  current,
  onCancel,
  onUpdate,
}: {
  current: number | null;
  onCancel: () => void;
  onUpdate: (max: number | null) => void;
}) {
  const [value, setValue] = useState<number | null>(current ?? 300);
  const step = 25;
  return (
    <div className="border-line-focus bg-surface flex flex-col gap-12 rounded-md border-2 p-16" role="group" aria-label="Edit budget">
      <p className="text-label-m text-fg">Budget per night</p>
      <div className="border-line-input flex items-center gap-8 rounded-md border px-12 py-8">
        <span className="text-heading-s text-fg flex-1">{value === null ? "No limit" : `Up to $${value}`}</span>
        <button
          type="button"
          aria-label="Lower budget"
          disabled={value === null || value <= 50}
          onClick={() => setValue((v) => (v === null ? v : Math.max(50, v - step)))}
          className="rounded-pill border-line-input flex size-28 items-center justify-center border disabled:opacity-50"
        >
          <Icon name="stepper-minus" size={14} />
        </button>
        <button
          type="button"
          aria-label="Raise budget"
          onClick={() => setValue((v) => (v === null ? 300 : v + step))}
          className="rounded-pill border-line-input flex size-28 items-center justify-center border"
        >
          <Icon name="stepper-plus" size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-8">
        {[250, 350].map((n) => (
          <RequirementChip key={n} state="suggested" label={`$${n}`} onClick={() => setValue(n)} />
        ))}
        <RequirementChip state="suggested" label="No limit" onClick={() => setValue(null)} />
      </div>
      <p className="text-body-s text-fg-secondary">Per night, before taxes and fees. Totals on each stay include them.</p>
      <div className="flex justify-end gap-8">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onUpdate(value)} disabled={value === current}>
          Update results
        </Button>
      </div>
    </div>
  );
}
