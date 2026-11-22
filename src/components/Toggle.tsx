/** Switch (Figma "Toggle · off", 44 × 24). The label sits beside it and names it. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <label className="text-label-m text-fg flex cursor-pointer items-center gap-[10px]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`rounded-pill relative h-24 w-44 shrink-0 transition-colors ${checked ? "bg-brand" : "bg-[var(--border-input)]"}`}
      >
        <span
          className={`rounded-pill bg-surface absolute top-2 left-2 size-20 transition-transform motion-reduce:transition-none ${checked ? "translate-x-20" : ""}`}
        />
      </button>
    </label>
  );
}
