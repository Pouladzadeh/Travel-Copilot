/**
 * Switch (Figma "Toggle · off/on", 44 × 24). Either show a label beside it,
 * or point to a heading that names it with ariaLabelledBy.
 */
export function Toggle({
  checked,
  onChange,
  label,
  ariaLabelledBy,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
  ariaLabelledBy?: string;
}) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      onClick={() => onChange(!checked)}
      className={`rounded-pill relative h-24 w-44 shrink-0 transition-colors ${checked ? "bg-brand" : "bg-[var(--border-input)]"}`}
    >
      <span
        className={`rounded-pill bg-surface absolute top-2 left-2 size-20 transition-transform motion-reduce:transition-none ${checked ? "translate-x-20" : ""}`}
      />
    </button>
  );
  if (!label) return button;
  return (
    <label className="text-label-m text-fg flex cursor-pointer items-center gap-[10px]">
      {label}
      {button}
    </label>
  );
}
