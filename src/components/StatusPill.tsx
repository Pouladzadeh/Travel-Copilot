import { Icon, type IconName } from "./Icon";

/**
 * Status pill (Figma 8:160): one fact about a hotel. Each type pairs a colour
 * with an icon or explicit wording, so meaning never depends on colour alone.
 * 24px high.
 */
export type PillType =
  | "copilot"
  | "confirmed"
  | "unconfirmed"
  | "danger"
  | "wildcard"
  | "sponsored"
  | "conditional"
  | "partial";

const styles: Record<PillType, { shell: string; text: string; icon?: IconName }> = {
  copilot: { shell: "bg-copilot border border-line-copilot", text: "text-fg-copilot", icon: "pill-sparkle" },
  confirmed: { shell: "bg-confirmed", text: "text-fg-confirmed", icon: "pill-check" },
  unconfirmed: { shell: "bg-unconfirmed", text: "text-fg-unconfirmed", icon: "pill-alert" },
  danger: { shell: "bg-danger", text: "text-fg-danger", icon: "pill-alert-danger" },
  wildcard: { shell: "bg-brand-subtle", text: "text-fg-link", icon: "pill-compass" },
  sponsored: { shell: "bg-sponsored", text: "text-fg-secondary" },
  conditional: { shell: "bg-surface border border-fg-unconfirmed", text: "text-fg-unconfirmed", icon: "pill-clock" },
  partial: { shell: "bg-surface border border-fg-unconfirmed", text: "text-fg-unconfirmed", icon: "pill-partial" },
};

export function StatusPill({ type, label, className = "" }: { type: PillType; label: string; className?: string }) {
  const s = styles[type];
  return (
    <span
      className={`inline-flex items-center gap-4 whitespace-nowrap rounded-pill px-8 py-4 text-label-s ${s.shell} ${s.text} ${className}`}
    >
      {s.icon && <Icon name={s.icon} size={12} />}
      {label}
    </span>
  );
}
