"use client";

import { Icon } from "./Icon";

/**
 * Requirement chip (Figma 8:130): what Copilot understood, shown back to the
 * traveler.
 *  - active:      a requirement in use; the × removes it.
 *  - suggested:   a requirement the traveler can add with +.
 *  - unconfirmed: Copilot made an assumption or could not verify it.
 *  - filter:      a results filter that opens a menu.
 */
export type ChipState = "active" | "suggested" | "unconfirmed" | "filter";

type RequirementChipProps = {
  label: string;
  state?: ChipState;
  /** Active: remove. Suggested: add. Filter: open menu. Unconfirmed: edit. */
  onClick?: () => void;
  /** Active chips: clicking the label (not the ×) edits the requirement. */
  onEdit?: () => void;
  className?: string;
};

const shell = "inline-flex items-center gap-8 whitespace-nowrap rounded-pill px-12 py-8 text-label-m";

export function RequirementChip({ label, state = "active", onClick, onEdit, className = "" }: RequirementChipProps) {
  if (state === "active") {
    return (
      <span className={`${shell} bg-brand-subtle text-fg-link ${className}`}>
        {onEdit ? (
          <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} className="hover:underline">
            {label}
          </button>
        ) : (
          <span>{label}</span>
        )}
        <button type="button" onClick={onClick} aria-label={`Remove ${label}`} className="rounded-pill -m-4 p-4 hover:bg-white/70">
          <Icon name="chip-x" size={14} />
        </button>
      </span>
    );
  }

  if (state === "unconfirmed") {
    const content = (
      <>
        <Icon name="chip-alert" size={14} />
        <span>{label}</span>
      </>
    );
    return onClick ? (
      <button type="button" onClick={onClick} className={`${shell} bg-unconfirmed text-fg-unconfirmed ${className}`}>
        {content}
      </button>
    ) : (
      <span className={`${shell} bg-unconfirmed text-fg-unconfirmed ${className}`}>{content}</span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup={state === "filter" ? "menu" : undefined}
      aria-label={state === "suggested" ? `Add ${label}` : undefined}
      className={`${shell} border-line-strong bg-surface text-fg hover:bg-subtle border ${className}`}
    >
      <span>{label}</span>
      <Icon name={state === "filter" ? "chevron-down" : "chip-plus"} size={14} />
    </button>
  );
}
